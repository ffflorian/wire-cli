import axios, {AxiosError} from 'axios';
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

export interface Response<T> {
  cookies: Cookies;
  data: T;
}

export async function initatePasswordReset(emailAddress: string, environment: string): Promise<void> {
  await axios.request({
    data: {email: emailAddress},
    method: 'post',
    url: `${environment}/password-reset`,
    validateStatus: status => status === HTTP_STATUS.CREATED,
  });
}

export async function completePasswordReset(
  resetCode: string,
  emailAddress: string,
  newPassword: string,
  environment: string
) {
  await axios.request({
    data: {
      code: resetCode,
      email: emailAddress,
      password: newPassword,
    },
    method: 'post',
    url: `${environment}/password-reset`,
  });
}

export async function login(backendURL: string, email: string, password: string): Promise<Response<TokenData>> {
  try {
    const {data, headers} = await axios.request({
      data: {email, password},
      method: 'post',
      url: `${backendURL}/login`,
    });
    return {cookies: parseCookies(headers), data};
  } catch (error) {
    if ((error as AxiosError).isAxiosError) {
      const maybeMessage = (error as AxiosError).response?.data?.message || '(no message)';
      const errorCode = (error as AxiosError).response?.status;
      throw new Error(`Request failed with status code ${errorCode}: ${maybeMessage}`);
    }
    throw error;
  }
}

export async function logout(
  backendURL: string,
  {access_token, token_type}: TokenData,
  cookieString: string
): Promise<void> {
  await axios.request({
    headers: {
      Authorization: `${token_type} ${access_token}`,
      Cookie: cookieString,
    },
    method: 'post',
    url: `${backendURL}/access/logout`,
  });
}

export async function getClients(
  backendURL: string,
  {access_token, token_type}: TokenData
): Promise<Response<Client[]>> {
  const {data, headers} = await axios.request({
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'get',
    url: `${backendURL}/clients`,
  });

  return {cookies: parseCookies(headers), data};
}

export async function deleteClient(
  backendURL: string,
  clientId: string,
  password: string,
  {access_token, token_type}: TokenData
): Promise<void> {
  await axios.request({
    data: {password},
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'delete',
    url: `${backendURL}/clients/${clientId}`,
  });
}
