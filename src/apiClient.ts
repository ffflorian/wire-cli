import axios, {AxiosError} from 'axios';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';
import {GenericMessage} from '@wireapp/protocol-messaging';
import {RegisteredClient as Client} from '@wireapp/api-client/dist/client/';

import {chunk, Cookies, parseCookies} from './util';
import {User, UserPreKeyBundleMap} from '@wireapp/api-client/dist/user';
import {ClientMismatch, NewOTRMessage, OTRRecipients, UserClients} from '@wireapp/api-client/dist/conversation';
import {Members} from '@wireapp/api-client/dist/team';
import {Self} from '@wireapp/api-client/dist/self';
import {PreKeyBundle} from '@wireapp/api-client/dist/auth';
import {encryptMessage} from './crypto';

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

export async function getUser(
  userId: string,
  backendURL: string,
  {access_token, token_type}: TokenData
): Promise<User> {
  const {data} = await axios.request({
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'get',
    url: `${backendURL}/users/${userId}`,
  });
  return data;
}

export async function getSelf(backendURL: string, {access_token, token_type}: TokenData): Promise<Self> {
  const {data} = await axios.request({
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'get',
    url: `${backendURL}/self`,
  });
  return data;
}

export async function getUserPreKeys(
  userId: string,
  backendURL: string,
  {access_token, token_type}: TokenData
): Promise<PreKeyBundle> {
  const {data} = await axios.request({
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'get',
    url: `${backendURL}/users/${userId}/prekeys`,
  });

  return data;
}

export async function getAllTeamMembers(
  teamId: string,
  backendURL: string,
  {access_token, token_type}: TokenData
): Promise<Members> {
  const {data} = await axios.request({
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'get',
    url: `${backendURL}/teams/${teamId}/members`,
  });
  return data;
}

async function getPreKeyBundle(
  teamId: string,
  backendURL: string,
  accessTokenData: TokenData
): Promise<UserPreKeyBundleMap> {
  const {members: teamMembers} = await getAllTeamMembers(teamId, backendURL, accessTokenData);

  const members = teamMembers.map(member => ({id: member.user}));

  const preKeys = await Promise.all(members.map(member => getUserPreKeys(member.id, backendURL, accessTokenData)));

  return preKeys.reduce((bundleMap: UserPreKeyBundleMap, bundle) => {
    bundleMap[bundle.user] = {};
    for (const client of bundle.clients) {
      bundleMap[bundle.user][client.client] = client.prekey;
    }
    return bundleMap;
  }, {});
}

export async function broadcastGenericMessage(
  teamId: string,
  genericMessage: GenericMessage,
  clientId: string,
  backendURL: string,
  accessTokenData: TokenData
): Promise<void> {
  const plainTextArray = GenericMessage.encode(genericMessage).finish();
  const preKeyBundle = await getPreKeyBundle(teamId, backendURL, accessTokenData);
  const recipients = await encryptMessage(plainTextArray, preKeyBundle);
  return sendOTRBroadcastMessage(clientId, recipients, plainTextArray, backendURL, accessTokenData);
}

async function sendOTRBroadcastMessage(
  sendingClientId: string,
  recipients: OTRRecipients,
  plainTextArray: Uint8Array,
  backendURL: string,
  accessTokenData: TokenData
): Promise<void> {
  const message: NewOTRMessage = {
    recipients,
    report_missing: Object.keys(recipients),
    sender: sendingClientId,
  };

  try {
    await postBroadcastMessage(message, backendURL, accessTokenData);
  } catch (error) {
    const reEncryptedMessage = await onClientMismatch(error, message, plainTextArray, backendURL, accessTokenData);
    await postBroadcastMessage(reEncryptedMessage, backendURL, accessTokenData);
  }
}

async function postMultiPreKeyBundlesChunk(
  userClientMap: UserClients,
  backendURL: string,
  {access_token, token_type}: TokenData
): Promise<UserPreKeyBundleMap> {
  const {data} = await axios.request({
    data: userClientMap,
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'post',
    url: `${backendURL}/users/prekeys`,
  });

  return data;
}

async function postMultiPreKeyBundles(
  userClientMap: UserClients,
  backendURL: string,
  accessTokenData: TokenData,
  // eslint-disable-next-line no-magic-numbers
  limit: number = 128
): Promise<UserPreKeyBundleMap> {
  const userIdChunks = chunk(Object.keys(userClientMap), limit);
  const userPreKeyBundleMapChunks = await Promise.all(
    userIdChunks.map(userIdChunk =>
      postMultiPreKeyBundlesChunk(
        userIdChunk.reduce(
          (chunkedUserClientMap, userId) => ({
            ...chunkedUserClientMap,
            [userId]: userClientMap[userId],
          }),
          {}
        ),
        backendURL,
        accessTokenData
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

async function onClientMismatch(
  error: AxiosError,
  message: NewOTRMessage,
  plainTextArray: Uint8Array,
  backendURL: string,
  accessTokenData: TokenData
): Promise<NewOTRMessage> {
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
      const missingPreKeyBundles = await postMultiPreKeyBundles(missing, backendURL, accessTokenData);
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

async function postBroadcastMessage(
  messageData: NewOTRMessage,
  backendURL: string,
  {access_token, token_type}: TokenData
): Promise<ClientMismatch> {
  const {data} = await axios.request({
    data: messageData,
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
    method: 'post',
    url: `${backendURL}/broadcast/otr/messages`,
  });
  return data;
}
