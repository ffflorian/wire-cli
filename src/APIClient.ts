import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';
import {ClientType, RegisteredClient as Client, UpdatedClient} from '@wireapp/api-client/src/client/';
import {UserUpdate as SelfUpdate} from '@wireapp/api-client/src/user/';
import {Self} from '@wireapp/api-client/src/self';
import {UserPreKeyBundleMap} from '@wireapp/api-client/src/user';
import {UserClients} from '@wireapp/api-client/src/conversation';
import {Members} from '@wireapp/api-client/src/team';
import {PreKeyBundle} from '@wireapp/api-client/src/auth';

import {getLogger, Cookies, parseCookies, TryFunction, isAxiosError} from './util';

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
  private static readonly URL = {
    ACCESS: 'access',
    CLIENTS: 'clients',
    COMPLETE: 'complete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    MEMBERS: 'members',
    PASSWORD_RESET: 'password-reset',
    PREKEYS: 'prekeys',
    SELF: 'self',
    TEAMS: 'teams',
    USERS: 'users',
  };

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
        url: `/${APIClient.URL.PASSWORD_RESET}`,
        validateStatus: status => status === HTTP_STATUS.CREATED,
      },
      false,
      true
    );
  }

  async getUserPreKeys(userId: string): Promise<Response<PreKeyBundle>> {
    const {data, headers} = await this.request<PreKeyBundle>({
      method: 'get',
      url: `/${APIClient.URL.USERS}/${userId}/${APIClient.URL.PREKEYS}`,
    });

    return {cookies: parseCookies(headers), data};
  }

  async getAllTeamMembers(teamId: string): Promise<Response<Members>> {
    const {data, headers} = await this.request<Members>({
      method: 'get',
      url: `/${APIClient.URL.TEAMS}/${teamId}/${APIClient.URL.MEMBERS}`,
    });

    return {cookies: parseCookies(headers), data};
  }

  async postMultiPreKeyBundlesChunk(userClientMap: UserClients): Promise<UserPreKeyBundleMap> {
    const {data} = await this.request<UserPreKeyBundleMap>({
      data: userClientMap,
      method: 'post',
      url: `/${APIClient.URL.USERS}/${APIClient.URL.PREKEYS}`,
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
        url: `/${APIClient.URL.PASSWORD_RESET}/${APIClient.URL.COMPLETE}`,
      },
      false
    );
  }

  async login(permanent: boolean = false): Promise<Response<TokenData>> {
    const {data: accessTokenData, headers} = await this.tryRequest(() =>
      axios.request({
        baseURL: this.backendURL,
        data: {
          clientType: permanent ? ClientType.PERMANENT : ClientType.TEMPORARY,
          email: this.emailAddress,
          password: this.password,
        },
        method: 'post',
        url: `/${APIClient.URL.LOGIN}`,
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
    await this.request(
      {
        method: 'post',
        url: `/${APIClient.URL.ACCESS}/${APIClient.URL.LOGOUT}`,
      },
      true
    );
  }

  async getClients(): Promise<Response<Client[]>> {
    const {data, headers} = await this.request<Client[]>({
      method: 'get',
      url: `/${APIClient.URL.CLIENTS}`,
    });

    return {cookies: parseCookies(headers), data};
  }

  async getClient(clientId: string): Promise<Response<Client>> {
    const {data, headers} = await this.request<Client>({
      method: 'get',
      url: `/${APIClient.URL.CLIENTS}/${clientId}`,
    });

    return {cookies: parseCookies(headers), data};
  }

  async deleteClient(clientId: string): Promise<void> {
    await this.request({
      data: {password: this.password},
      method: 'delete',
      url: `/${APIClient.URL.CLIENTS}/${clientId}`,
    });
  }

  async putClient(clientId: string, updatedClient: UpdatedClient): Promise<void> {
    await this.request({
      data: updatedClient,
      method: 'put',
      url: `/${APIClient.URL.CLIENTS}/${clientId}`,
    });
  }

  async putSelf(profileData: SelfUpdate): Promise<void> {
    await this.request({
      data: profileData,
      method: 'put',
      url: `/${APIClient.URL.SELF}`,
    });
  }

  async getSelf(): Promise<Response<Self>> {
    const {data, headers} = await this.request<Self>({
      method: 'get',
      url: `/${APIClient.URL.SELF}`,
    });

    return {cookies: parseCookies(headers), data};
  }

  private checkCookieString(): void {
    if (!this.cookieString) {
      throw new Error('No cookie saved. Please login first.');
    }
  }

  private checkAccessToken(): void {
    if (!this.accessToken) {
      throw new Error('No access token saved. Please login first.');
    }
  }

  private request<T>(
    config: AxiosRequestConfig,
    accessTokenNeeded?: boolean,
    getErrorCode?: boolean
  ): Promise<AxiosResponse<T>>;
  private request(
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

  private async tryRequest(fn: TryFunction, getErrorCode: true): Promise<{errorCode: HTTP_STATUS}>;
  private async tryRequest<T>(fn: TryFunction, getErrorCode?: boolean): Promise<T>;
  private async tryRequest<T>(fn: TryFunction, getErrorCode?: boolean): Promise<T | {errorCode: HTTP_STATUS}> {
    try {
      return await fn();
    } catch (error) {
      if (isAxiosError(error)) {
        const maybeMessage = error.response?.data?.message || '(no message)';
        const errorCode = error.response?.status;
        if (getErrorCode) {
          return {errorCode} as {errorCode: HTTP_STATUS};
        }
        throw new Error(`Request failed with status code ${errorCode}: ${maybeMessage}`);
      }
      throw error;
    }
  }
}
