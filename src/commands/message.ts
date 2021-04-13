import {Account} from '@wireapp/core';
import {APIClient} from '@wireapp/api-client';
import {ClientType} from '@wireapp/api-client/src/client/';
import prompts from 'prompts';

import {CommonOptions} from '../CommonOptions';
import {
  getLogger,
  getBackendURL,
  getEmailAddress,
  getPassword,
  getWebSocketURL,
  getConversationID,
  getMessageID,
} from '../util';

const logger = getLogger('set-availability');

export interface SendMessageOptions extends CommonOptions {
  conversationID?: string;
  defaultWebSocketURL: string;
  message?: string;
  webSocketURL?: string;
}

export interface DeleteMessageOptions extends CommonOptions {
  conversationID?: string;
  defaultWebSocketURL: string;
  messageID?: string;
  webSocketURL?: string;
}

export async function sendMessage({
  backendURL,
  conversationID,
  defaultBackendURL,
  defaultWebSocketURL,
  dryRun,
  emailAddress,
  message,
  password,
  webSocketURL,
}: SendMessageOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  webSocketURL ||= await getWebSocketURL(defaultWebSocketURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();
  conversationID ||= await getConversationID();
  message ||= (
    await prompts(
      {
        message: 'What would you like to say?',
        name: 'message',
        type: 'text',
      },
      {onCancel: () => process.exit()}
    )
  ).message!;

  const apiClient = new APIClient({
    urls: {
      name: 'backend',
      rest: backendURL,
      ws: webSocketURL,
    },
  });

  const account = new Account(apiClient);

  logger.info('Logging in ...');
  await account.login({clientType: ClientType.TEMPORARY, email: emailAddress, password});

  logger.info(`Sending message "${message}" to conversation "${conversationID}"...`);

  if (!dryRun) {
    const payload = account.service!.conversation.messageBuilder.createText(conversationID, message!).build();
    await account.service!.conversation.send(payload);
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}

export async function deleteMessage({
  backendURL,
  conversationID,
  defaultBackendURL,
  defaultWebSocketURL,
  dryRun,
  emailAddress,
  messageID,
  password,
  webSocketURL,
}: DeleteMessageOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  webSocketURL ||= await getWebSocketURL(defaultWebSocketURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();
  conversationID ||= await getConversationID();
  messageID ||= await getMessageID();

  const apiClient = new APIClient({
    urls: {
      name: 'backend',
      rest: backendURL,
      ws: webSocketURL,
    },
  });

  const account = new Account(apiClient);

  logger.info('Logging in ...');
  await account.login({clientType: ClientType.TEMPORARY, email: emailAddress, password});

  logger.info(`Deleting message "${messageID}" in conversation "${conversationID}"...`);

  if (!dryRun) {
    await account.service!.conversation.deleteMessageEveryone(conversationID, messageID!);
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
