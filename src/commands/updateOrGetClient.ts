import {RegisteredClient} from '@wireapp/api-client/src/client/';

import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getPassword} from '../util';

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
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  console.info('Logging in ...');
  await apiClient.login();

  console.info(`Updating client with ID "${clientId}" ...`);
  if (!dryRun) {
    await apiClient.putClient(clientId, {label});
  }
}

export async function getClient({
  defaultBackendURL,
  backendURL,
  clientId,
  emailAddress,
  password,
}: GetClientOptions): Promise<RegisteredClient> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  console.info('Logging in ...');
  await apiClient.login();

  console.info(`Getting client with ID "${clientId}" ...`);
  const {data: client} = await apiClient.getClient(clientId);

  return client;
}

export async function getAllClients({
  defaultBackendURL,
  backendURL,
  emailAddress,
  password,
}: CommonOptions): Promise<RegisteredClient[]> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  console.info('Logging in ...');
  await apiClient.login();

  console.info('Getting all clients ...');
  const {data: clients} = await apiClient.getClients();

  console.info('Found clients:', clients);

  return clients;
}
