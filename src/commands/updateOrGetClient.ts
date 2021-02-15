import {RegisteredClient} from '@wireapp/api-client/src/client/';

import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {ask} from '../util';

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
  if (!backendURL) {
    backendURL = await ask(`Enter the backend URL (default is "${defaultBackendURL}"):`, /.+\..+/, defaultBackendURL);
  }

  if (!backendURL.startsWith('https')) {
    backendURL = `https://${backendURL}`;
  }

  console.info(`Using "${backendURL}" as backend.`);

  if (!emailAddress) {
    emailAddress = await ask('Enter your Wire email address:', /.+@.+\..+/);
  }

  console.info(`Using "${emailAddress}" as email address.`);

  if (!password) {
    password = await ask('Enter your Wire password:');
  }

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
  if (!backendURL) {
    backendURL = await ask(`Enter the backend URL (default is "${defaultBackendURL}"):`, /.+\..+/, defaultBackendURL);
  }

  if (!backendURL.startsWith('https')) {
    backendURL = `https://${backendURL}`;
  }

  console.info(`Using "${backendURL}" as backend.`);

  if (!emailAddress) {
    emailAddress = await ask('Enter your Wire email address:', /.+@.+\..+/);
  }

  console.info(`Using "${emailAddress}" as email address.`);

  if (!password) {
    password = await ask('Enter your Wire password:');
  }

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
  if (!backendURL) {
    backendURL = await ask(`Enter the backend URL (default is "${defaultBackendURL}"):`, /.+\..+/, defaultBackendURL);
  }

  if (!backendURL.startsWith('https')) {
    backendURL = `https://${backendURL}`;
  }

  console.info(`Using "${backendURL}" as backend.`);

  if (!emailAddress) {
    emailAddress = await ask('Enter your Wire email address:', /.+@.+\..+/);
  }

  console.info(`Using "${emailAddress}" as email address.`);

  if (!password) {
    password = await ask('Enter your Wire password:');
  }

  const apiClient = new APIClient(backendURL, emailAddress, password);

  console.info('Logging in ...');
  await apiClient.login();

  console.info('Getting all clients ...');
  const {data: clients} = await apiClient.getClients();

  console.info('Found clients:', clients);

  return clients;
}
