import axios, {AxiosError, AxiosRequestConfig} from 'axios';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';
import {GenericMessage} from '@wireapp/protocol-messaging';
import {ClientType, RegisteredClient as Client, UpdatedClient} from '@wireapp/api-client/src/client/';
import {UserUpdate as SelfUpdate} from '@wireapp/api-client/src/user/';
import {Self} from '@wireapp/api-client/src/self';
import {UserPreKeyBundleMap} from '@wireapp/api-client/src/user';
import {
  ClientMismatch,
  NewOTRMessage,
  OTRClientMap,
  OTRRecipients,
  UserClients,
} from '@wireapp/api-client/src/conversation';
import {Members} from '@wireapp/api-client/src/team';
import {PreKeyBundle} from '@wireapp/api-client/src/auth';

import {encryptMessage} from './crypto';
import {chunk, getLogger, Cookies, parseCookies, TryFunction} from './util';

export interface TokenData {
  access_token: string;
  expires_in: number;
  token_type: string;
  user: string;
}

export interface Response<T> {
  cookies: Cookies;
  data: T;
}

const logger = getLogger('APIClient');

export class APIClient {
  private readonly backendURL: string;
  private readonly emailAddress: string;
  private readonly password: string;
  private accessToken?: TokenData;
  private cookieString?: string;

  constructor(backendURL: string, emailAddress: string, password: string) {
    this.backendURL = backendURL;
    this.emailAddress = emailAddress;
    this.password = password;
  }

  initatePasswordReset(): Promise<void | {errorCode: HTTP_STATUS}> {
    return this.request(
      {
        data: {email: this.emailAddress},
        method: 'post',
        url: '/password-reset',
        validateStatus: status => status === HTTP_STATUS.CREATED,
      },
      false,
      true
    );
  }

  async broadcastGenericMessage(teamId: string, genericMessage: GenericMessage, clientId: string): Promise<void> {
    const plainTextArray = GenericMessage.encode(genericMessage).finish();
    const preKeyBundle = await this.getPreKeyBundle(teamId);
    const recipients = await encryptMessage(plainTextArray, preKeyBundle);
    return this.sendOTRBroadcastMessage(clientId, recipients, plainTextArray);
  }

  async getPreKeyBundle(teamId: string): Promise<UserPreKeyBundleMap> {
    const {members: teamMembers} = await this.getAllTeamMembers(teamId);

    const members = teamMembers.map(member => ({id: member.user}));

    const preKeys = await Promise.all(members.map(member => this.getUserPreKeys(member.id)));

    return preKeys.reduce((bundleMap: UserPreKeyBundleMap, bundle) => {
      bundleMap[bundle.user] = {};
      for (const client of bundle.clients) {
        bundleMap[bundle.user][client.client] = client.prekey;
      }
      return bundleMap;
    }, {});
  }

  async sendOTRBroadcastMessage(
    sendingClientId: string,
    recipients: OTRRecipients<Uint8Array>,
    plainTextArray: Uint8Array
  ): Promise<void> {
    const message: NewOTRMessage<Uint8Array> = {
      recipients,
      report_missing: Object.keys(recipients),
      sender: sendingClientId,
    };

    try {
      await this.postBroadcastMessage(message);
    } catch (error) {
      const reEncryptedMessage = await this.onClientMismatch(error, message, plainTextArray);
      await this.postBroadcastMessage(reEncryptedMessage);
    }
  }

  private async onClientMismatch(
    error: AxiosError,
    message: NewOTRMessage<Uint8Array>,
    plainTextArray: Uint8Array
  ): Promise<NewOTRMessage<Uint8Array>> {
    if (error.response?.status === HTTP_STATUS.PRECONDITION_FAILED) {
      const {missing, deleted}: {deleted: UserClients; missing: UserClients} = error.response.data;

      const deletedUserIds = Object.keys(deleted);
      const missingUserIds = Object.keys(missing);

      if (deletedUserIds.length) {
        for (const deletedUserId of deletedUserIds) {
          for (const deletedClientId of deleted[deletedUserId]) {
            const deletedUser = message.recipients[deletedUserId];
            if (deletedUser) {
              delete deletedUser[deletedClientId];
            }
          }
        }
      }

      if (missingUserIds.length) {
        const missingPreKeyBundles = await this.postMultiPreKeyBundles(missing);
        const reEncryptedPayloads = await encryptMessage(plainTextArray, missingPreKeyBundles);
        for (const missingUserId of missingUserIds) {
          for (const missingClientId in reEncryptedPayloads[missingUserId]) {
            const missingUser = message.recipients[missingUserId];
            if (!missingUser) {
              message.recipients[missingUserId] = {};
            }
            message.recipients[missingUserId][missingClientId] = reEncryptedPayloads[missingUserId][missingClientId];
          }
        }
      }

      return message;
    }

    throw error;
  }

  async getUserPreKeys(userId: string): Promise<PreKeyBundle> {
    const {data} = await this.request({
      method: 'get',
      url: `/users/${userId}/prekeys`,
    });

    return data;
  }

  async getAllTeamMembers(teamId: string): Promise<Members> {
    const {data} = await this.request({
      method: 'get',
      url: `/teams/${teamId}/members`,
    });
    return data;
  }

  async postMultiPreKeyBundlesChunk(userClientMap: UserClients): Promise<UserPreKeyBundleMap> {
    const {data} = await this.request({
      data: userClientMap,
      method: 'post',
      url: '/users/prekeys',
    });

    return data;
  }

  async postMultiPreKeyBundles(
    userClientMap: UserClients,
    // eslint-disable-next-line no-magic-numbers
    limit: number = 128
  ): Promise<UserPreKeyBundleMap> {
    const userIdChunks = chunk(Object.keys(userClientMap), limit);
    const userPreKeyBundleMapChunks = await Promise.all(
      userIdChunks.map(userIdChunk =>
        this.postMultiPreKeyBundlesChunk(
          userIdChunk.reduce(
            (chunkedUserClientMap, userId) => ({
              ...chunkedUserClientMap,
              [userId]: userClientMap[userId],
            }),
            {}
          )
        )
      )
    );
    return userPreKeyBundleMapChunks.reduce(
      (userPreKeyBundleMap, userPreKeyBundleMapChunk) => ({
        ...userPreKeyBundleMap,
        ...userPreKeyBundleMapChunk,
      }),
      {}
    );
  }

  async postBroadcastMessage(payload: NewOTRMessage<Uint8Array>): Promise<ClientMismatch> {
    const stringPayload: NewOTRMessage<string> = {
      ...payload,
      data: payload.data ? Buffer.from(payload.data).toString('base64') : undefined,
      recipients: Object.fromEntries(
        Object.entries(payload.recipients).map(([userId, otrClientMap]) => {
          const otrClientMapWithBase64: OTRClientMap<string> = Object.fromEntries(
            Object.entries(otrClientMap).map(([clientId, payload]) => {
              return [clientId, Buffer.from(payload).toString('base64')];
            })
          );
          return [userId, otrClientMapWithBase64];
        })
      ),
    };

    const {data} = await this.request({
      data: stringPayload,
      method: 'post',
      url: '/broadcast/otr/messages',
    });
    return data;
  }

  async completePasswordReset(resetCode: string, newPassword: string): Promise<void> {
    await this.request(
      {
        data: {
          code: resetCode,
          email: this.emailAddress,
          password: newPassword,
        },
        method: 'post',
        url: '/password-reset',
      },
      false
    );
  }

  async login(permanent: boolean = false): Promise<Response<TokenData>> {
    const {data: accessTokenData, headers} = await this.tryRequest(() =>
      axios.request({
        baseURL: this.backendURL,
        data: {
          clientType: permanent ? ClientType.TEMPORARY : ClientType.PERMANENT,
          email: this.emailAddress,
          password: this.password,
        },
        method: 'post',
        url: '/login',
      })
    );

    this.accessToken = accessTokenData;

    const cookies = parseCookies(headers);

    if (cookies.zuid) {
      this.cookieString = `zuid=${cookies.zuid}`;
    } else {
      logger.warn('No `zuid` cookie received from server.');
    }

    return {cookies, data: accessTokenData};
  }

  async logout(): Promise<void> {
    this.checkCookieString();
    this.checkAccessToken();

    await this.request({
      method: 'post',
      url: '/access/logout',
    });
  }

  async getClients(): Promise<Response<Client[]>> {
    const {data, headers} = await this.request({
      method: 'get',
      url: '/clients',
    });

    return {cookies: parseCookies(headers), data};
  }

  async getClient(clientId: string): Promise<Response<Client>> {
    const {data, headers} = await this.request({
      method: 'get',
      url: `/clients/${clientId}`,
    });

    return {cookies: parseCookies(headers), data};
  }

  async deleteClient(clientId: string): Promise<void> {
    await this.request({
      data: {password: this.password},
      method: 'delete',
      url: `/clients/${clientId}`,
    });
  }

  async putClient(clientId: string, updatedClient: UpdatedClient): Promise<void> {
    await this.request({
      data: updatedClient,
      method: 'put',
      url: `/clients/${clientId}`,
    });
  }

  async putSelf(profileData: SelfUpdate): Promise<void> {
    await this.request({
      data: profileData,
      method: 'put',
      url: '/self',
    });
  }

  async getSelf(): Promise<Response<Self>> {
    const {data, headers} = await this.request({
      method: 'get',
      url: 'self',
    });

    return {cookies: parseCookies(headers), data};
  }

  private checkCookieString(): void {
    if (!this.cookieString) {
      throw new Error('No cookie received. Please login first.');
    }
  }

  private checkAccessToken(): void {
    if (!this.accessToken) {
      throw new Error('No access token received. Please login first.');
    }
  }

  private request<T>(config: AxiosRequestConfig, accessTokenNeeded?: boolean, getErrorCode?: boolean): Promise<T>;
  private request<T>(
    config: AxiosRequestConfig,
    accessTokenNeeded: boolean,
    getErrorCode: true
  ): Promise<{errorCode: HTTP_STATUS}>;
  private request<T>(
    config: AxiosRequestConfig,
    accessTokenNeeded = true,
    getErrorCode: boolean = false
  ): Promise<T | {errorCode: HTTP_STATUS}> {
    config.baseURL ??= this.backendURL;

    if (accessTokenNeeded) {
      this.checkAccessToken();
      this.checkCookieString();
      config.headers = {
        Authorization: `${this.accessToken!.token_type} ${this.accessToken!.access_token}`,
        Cookie: this.cookieString,
        ...config.headers,
      };
    }

    return this.tryRequest(() => axios.request(config), getErrorCode);
  }

  private async tryRequest<T>(fn: TryFunction, getErrorCode: true): Promise<{errorCode: HTTP_STATUS}>;
  private async tryRequest<T>(fn: TryFunction, getErrorCode?: boolean): Promise<T>;
  private async tryRequest<T>(fn: TryFunction, getErrorCode?: boolean): Promise<T | {errorCode: HTTP_STATUS}> {
    try {
      return await fn();
    } catch (error) {
      if ((error as AxiosError).isAxiosError) {
        const maybeMessage = (error as AxiosError<{message: string}>).response?.data?.message || '(no message)';
        const errorCode = (error as AxiosError).response?.status;
        if (getErrorCode) {
          return {errorCode} as {errorCode: HTTP_STATUS};
        }
        throw new Error(`Request failed with status code ${errorCode}: ${maybeMessage}`);
      }
      throw error;
    }
  }
}
