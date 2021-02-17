import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getPassword, pluralize} from '../util';

export interface DeleteAllClientsOptions extends CommonOptions {}

export async function deleteAllClients({
  defaultBackendURL,
  backendURL,
  dryRun,
  emailAddress,
  password,
}: DeleteAllClientsOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

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
