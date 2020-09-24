import axios, {AxiosError, AxiosPromise, AxiosRequestConfig} from 'axios';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';

import {Cookies, parseCookies} from './util';

export interface TokenData {
  access_token: string;
  expires_in: number;
  token_type: string;
  user: string;
}

export interface Location {
  lat: number;
  lon: number;
}

export interface Client {
  class: string;
  id: string;
  label: string;
  location: Location;
  model: string;
  time: string;
  type: string;
}

interface UserAsset {
  key: string;
  size: string;
  type: 'image';
}

export interface User {
  accent_id?: number;
  assets: UserAsset[];
  deleted?: boolean;
  email?: string;
  expires_at?: string;
  handle?: string;
  id: string;
  name: string;
  team?: string;
}

export type SelfUpdate = Partial<Pick<User, 'accent_id' | 'assets' | 'name'>>;

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
    try {
      const {data: accessTokenData, headers} = await axios.request({
        baseURL: this.backendURL,
        data: {email: this.emailAddress, password: this.password},
        method: 'post',
        url: '/login',
      });

      this.accessToken = accessTokenData;

      const cookies = parseCookies(headers);

      if (cookies.zuid) {
        this.cookieString = `zuid=${cookies.zuid}`;
      } else {
        console.warn('No `zuid` cookie received from server.');
      }

      return {cookies, data: accessTokenData};
    } catch (error) {
      if ((error as AxiosError).isAxiosError) {
        const maybeMessage = (error as AxiosError).response?.data?.message || '(no message)';
        const errorCode = (error as AxiosError).response?.status;
        throw new Error(`Request failed with status code ${errorCode}: ${maybeMessage}`);
      }
      throw error;
    }
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

  private request(config: AxiosRequestConfig): AxiosPromise {
    this.checkAccessToken();
    this.checkCookieString();

    return axios.request({
      baseURL: this.backendURL,
      headers: {
        Authorization: `${this.accessToken!.token_type} ${this.accessToken!.access_token}`,
        Cookie: this.cookieString,
      },
      ...config,
    });
  }
}
