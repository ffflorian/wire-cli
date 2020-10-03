import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {ask, pluralize} from '../util';

export interface DeleteAllClientsOptions extends CommonOptions {}

export async function deleteAllClients({
  backendURL,
  dryRun,
  emailAddress,
  password,
}: DeleteAllClientsOptions): Promise<void> {
  if (!backendURL) {
    backendURL = await ask('Enter the backend URL (e.g. "staging-nginz-https.zinfra.io"):', /.+\..+/);
  }

  if (!backendURL.startsWith('https')) {
    backendURL = `https://${backendURL}`;
  }

  if (!emailAddress) {
    emailAddress = await ask('Enter your Wire email address:', /.+@.+\..+/);
  }

  if (!password) {
    password = await ask('Enter your Wire password:');
  }

  const apiClient = new APIClient(backendURL, emailAddress, password);

  console.info('Logging in ...');
  await apiClient.login();

  console.info('Getting all clients ...');
  const {data: clients} = await apiClient.getClients();
  console.info(`Found ${clients.length} ${pluralize('client', clients.length)}.`);

  await Promise.all(
    clients.map(client => {
      console.info(`Deleting client with ID "${client.id}" ...`);
      return dryRun ? undefined : apiClient.deleteClient(client.id);
    })
  );

  console.info('Logging out ...');
  await apiClient.logout();
}
