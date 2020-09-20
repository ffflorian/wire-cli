import {Cookies, request} from './util';

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

export async function initatePasswordReset(emailAddress: string, environment: string) {
  await request({
    data: {email: emailAddress},
    method: 'post',
    url: `${environment}/password-reset`,
    wantedStatusCode: 201,
  });
}

export async function completePasswordReset(
  resetCode: string,
  emailAddress: string,
  newPassword: string,
  environment: string
) {
  await request({
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
  const data = {email, password};
  const {cookies, rawData} = await request({
    data,
    method: 'post',
    url: `${backendURL}/login`,
  });
  return {cookies, data: JSON.parse(rawData)};
}

export async function logout(
  backendURL: string,
  {access_token, token_type}: TokenData,
  cookieString: string
): Promise<void> {
  await request({
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
  const {cookies, rawData} = await request({
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'get',
    url: `${backendURL}/clients`,
  });

  return {cookies, data: JSON.parse(rawData)};
}

export async function deleteClient(
  backendURL: string,
  clientId: string,
  password: string,
  {access_token, token_type}: TokenData
): Promise<void> {
  await request({
    data: {password},
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'delete',
    url: `${backendURL}/clients/${clientId}`,
  });
}
