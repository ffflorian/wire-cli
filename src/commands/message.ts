import {Account} from '@wireapp/core';
import {APIClient} from '@wireapp/api-client';
import {ClientClassification, ClientType} from '@wireapp/api-client/src/client/';
import prompts from 'prompts';

import {CommonOptions} from '../CommonOptions';
import {
  getLogger,
  getBackendURL,
  getEmailAddress,
  getPassword,
  getConversationID,
  getPackageJson,
  getMessageID,
} from '../util';

const logger = getLogger('message');
const {name, version} = getPackageJson();

export interface SendMessageOptions extends CommonOptions {
  conversationID?: string;
  message?: string;
}

export interface DeleteMessageOptions extends CommonOptions {
  conversationID?: string;
  messageID?: string;
}

export async function sendMessage({
  backendURL,
  conversationID,
  defaultBackendURL,
  dryRun,
  emailAddress,
  message,
  password,
}: SendMessageOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
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
      ws: 'none',
    },
  });

  const account = new Account(apiClient);

  logger.info(`Logging in with email address "${emailAddress}" ...`);
  await account.login({clientType: ClientType.TEMPORARY, email: emailAddress, password}, undefined, {
    classification: ClientClassification.DESKTOP,
    cookieLabel: 'default',
    model: `${name} v${version}`,
  });

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
  dryRun,
  emailAddress,
  messageID,
  password,
}: DeleteMessageOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();
  conversationID ||= await getConversationID();
  messageID ||= await getMessageID();

  const apiClient = new APIClient({
    urls: {
      name: 'backend',
      rest: backendURL,
      ws: 'none',
    },
  });

  const account = new Account(apiClient);

  logger.info(`Logging in with email address "${emailAddress}" ...`);
  await account.login({clientType: ClientType.TEMPORARY, email: emailAddress, password}, undefined, {
    classification: ClientClassification.DESKTOP,
    cookieLabel: 'default',
    model: `${name} v${version}`,
  });

  logger.info(`Deleting message "${messageID}" in conversation "${conversationID}"...`);

  if (!dryRun) {
    await account.service!.conversation.deleteMessageEveryone(conversationID, messageID!);
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
