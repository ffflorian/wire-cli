import {login, getClients, deleteClient, logout} from './client';
import {CommonOptions} from './CommonOptions';
import {ask, pluralize} from './util';

export interface DeleteAllClientsOptions extends CommonOptions {}

export async function deleteAllClients({backendURL, dryRun, emailAddress}: DeleteAllClientsOptions): Promise<void> {
  if (!backendURL) {
    backendURL = await ask('Enter the backend URL (e.g. "staging-nginz-https.zinfra.io"):', /.+\..+/);
  }

  if (!backendURL.startsWith('https')) {
    backendURL = `https://${backendURL}`;
  }

  if (!emailAddress) {
    emailAddress = await ask('Enter your email address:', /.+@.+\..+/);
  }

  const password = await ask('Enter the password for your account:');

  console.info('Logging in ...');

  const {data: accessToken, cookies} = await login(backendURL, emailAddress, password);

  const cookieString = `zuid=${cookies.zuid}`;

  console.info('Getting all clients ...');
  const {data: clients} = await getClients(backendURL, accessToken);
  console.info(`Found ${clients.length} ${pluralize('client', clients.length)}.`);

  await Promise.all(
    clients.map(client => {
      console.info(`Deleting client with ID "${client.id}" ...`);
      return dryRun ? undefined : deleteClient(backendURL!, client.id, password, accessToken);
    })
  );

  console.info('Logging out ...');
  await logout(backendURL, accessToken, cookieString);
}
