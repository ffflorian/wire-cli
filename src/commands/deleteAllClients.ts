import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getLogger, getPassword, pluralize} from '../util';

export interface DeleteAllClientsOptions extends CommonOptions {}

const logger = getLogger('delete-all-clients');

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

  logger.info('Logging in ...');
  await apiClient.login();

  logger.info('Getting all clients ...');
  const {data: clients} = await apiClient.getClients();
  logger.info(`Found ${clients.length} ${pluralize('client', clients.length)}.`);

  if (!dryRun) {
    await Promise.all(
      clients.map(client => {
        logger.info(`Deleting client with ID "${client.id}" ...`);
        return dryRun ? undefined : apiClient.deleteClient(client.id);
      })
    );
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
