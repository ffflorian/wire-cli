import axios, {AxiosError, AxiosRequestConfig} from 'axios';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';
import {RegisteredClient as Client} from '@wireapp/api-client/dist/client/';
import {UserUpdate as SelfUpdate} from '@wireapp/api-client/dist/user/';

import {Cookies, parseCookies, TryFunction} from './util';

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

export class APIClient {
  private readonly backendURL: string;
  private readonly emailAddress: string;
  private readonly password: string;
  private accessToken?: TokenData;
  private cookieString?: string;

  constructor(backendURL: string, emailAddress: string, password: string) {
    if (!backendURL.startsWith('https')) {
      backendURL = `https://${backendURL}`;
    }

    this.backendURL = backendURL;
    this.emailAddress = emailAddress;
    this.password = password;
  }

  async initatePasswordReset(): Promise<void> {
    await this.request({
      data: {email: this.emailAddress},
      method: 'post',
      url: '/password-reset',
      validateStatus: status => status === HTTP_STATUS.CREATED,
    });
  }

  async completePasswordReset(resetCode: string, newPassword: string) {
    await this.request({
      data: {
        code: resetCode,
        email: this.emailAddress,
        password: newPassword,
      },
      method: 'post',
      url: '/password-reset',
    });
  }

  async login(): Promise<Response<TokenData>> {
    const {data: accessTokenData, headers} = await this.tryRequest(() =>
      axios.request({
        baseURL: this.backendURL,
        data: {email: this.emailAddress, password: this.password},
        method: 'post',
        url: '/login',
      })
    );

    this.accessToken = accessTokenData;

    const cookies = parseCookies(headers);

    if (cookies.zuid) {
      this.cookieString = `zuid=${cookies.zuid}`;
    } else {
      console.warn('No `zuid` cookie received from server.');
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

  async deleteClient(clientId: string): Promise<void> {
    await this.request({
      data: {password: this.password},
      method: 'delete',
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

  private request<T>(config: AxiosRequestConfig): Promise<T> {
    this.checkAccessToken();
    this.checkCookieString();

    return this.tryRequest(() =>
      axios.request({
        baseURL: this.backendURL,
        headers: {
          Authorization: `${this.accessToken!.token_type} ${this.accessToken!.access_token}`,
          Cookie: this.cookieString,
        },
        ...config,
      })
    );
  }

  private async tryRequest<T>(fn: TryFunction): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if ((error as AxiosError).isAxiosError) {
        const maybeMessage = (error as AxiosError<{message: string}>).response?.data?.message || '(no message)';
        const errorCode = (error as AxiosError).response?.status;
        throw new Error(`Request failed with status code ${errorCode}: ${maybeMessage}`);
      }
      throw error;
    }
  }
}
