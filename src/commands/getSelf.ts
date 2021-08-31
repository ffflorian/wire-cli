import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getLogger, getPassword} from '../util';

export interface GetSelfOptions extends CommonOptions {}

const logger = getLogger('get-self');

export async function getSelf({
  backendURL,
  defaultBackendURL,
  dryRun,
  emailAddress,
  password,
}: GetSelfOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  logger.info(`Logging in with email address "${emailAddress}" ...`);

  await apiClient.login();

  if (!dryRun) {
    const response = await apiClient.getSelf();
    logger.info(response.data);
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
