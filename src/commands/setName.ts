import prompts from 'prompts';
import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getLogger, getPassword} from '../util';

export interface SetNameOptions extends CommonOptions {
  newName?: string;
}

const logger = getLogger('set-name');

export async function setName({
  backendURL,
  defaultBackendURL,
  dryRun,
  emailAddress,
  newName,
  password,
}: SetNameOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();
  newName ||= (
    await prompts(
      {
        max: 128,
        message: 'Enter your new name (max. 128 chars):',
        name: 'newName',
        type: 'text',
      },
      {
        onCancel: () => process.exit(),
      }
    )
  ).newName;

  const apiClient = new APIClient(backendURL, emailAddress, password);

  logger.info(`Logging in with email address "${emailAddress}" ...`);

  await apiClient.login();

  logger.info(`Setting new name to "${newName}" ...`);

  if (!dryRun) {
    await apiClient.putSelf({name: newName!});
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
