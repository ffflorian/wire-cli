import axios, {AxiosError, AxiosRequestConfig} from 'axios';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';
import {ClientType, RegisteredClient as Client, UpdatedClient} from '@wireapp/api-client/src/client/';
import {UserUpdate as SelfUpdate} from '@wireapp/api-client/src/user/';

import {Cookies, getLogger, parseCookies, TryFunction} from './util';

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

  async completePasswordReset(resetCode: string, newPassword: string) {
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
