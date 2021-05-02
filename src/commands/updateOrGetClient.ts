import {RegisteredClient} from '@wireapp/api-client/src/client/';

import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getLogger, getPassword} from '../util';

export interface GetClientOptions extends CommonOptions {
  clientId: string;
}

export interface UpdateClientOptions extends GetClientOptions {
  label: string;
}

export async function updateClient({
  defaultBackendURL,
  backendURL,
  clientId,
  dryRun,
  emailAddress,
  label,
  password,
}: UpdateClientOptions): Promise<void> {
  const logger = getLogger('set-client-label');

  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  logger.info(`Logging in with email address "${emailAddress}" ...`);
  await apiClient.login();

  logger.info(`Updating client with ID "${clientId}" ...`);
  if (!dryRun) {
    await apiClient.putClient(clientId, {label});
  }
}

export async function getClient({
  backendURL,
  clientId,
  defaultBackendURL,
  emailAddress,
  password,
}: GetClientOptions): Promise<RegisteredClient> {
  const logger = getLogger('get-client');

  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  logger.info(`Logging in with email address "${emailAddress}" ...`);
  await apiClient.login();

  logger.info(`Getting client with ID "${clientId}" ...`);
  const {data: client} = await apiClient.getClient(clientId);

  logger.info('Logging out ...');
  await apiClient.logout();

  return client;
}

export async function getAllClients({
  defaultBackendURL,
  backendURL,
  emailAddress,
  password,
}: CommonOptions): Promise<RegisteredClient[]> {
  const logger = getLogger('get-all-clients');

  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  logger.info(`Logging in with email address "${emailAddress}" ...`);
  await apiClient.login();

  logger.info('Getting all clients ...');
  const {data: clients} = await apiClient.getClients();

  logger.info('Logging out ...');
  await apiClient.logout();

  logger.info('Found clients:', clients);

  return clients;
}
