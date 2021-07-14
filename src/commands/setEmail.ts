import prompts from 'prompts';
import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getLogger, getPassword} from '../util';

export interface SetEmailOptions extends CommonOptions {
  newEmailAddress?: string;
}

const logger = getLogger('set-email');

export async function setEmail({
  backendURL,
  defaultBackendURL,
  dryRun,
  emailAddress,
  newEmailAddress,
  password,
}: SetEmailOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();
  newEmailAddress ||= (
    await prompts(
      {
        hint: 'Email address must be in the format email@example.com',
        message: 'Enter your new email address',
        name: 'newEmailAddress',
        type: 'text',
        validate: input => input.match(/.+@.+\..+/),
      },
      {
        onCancel: () => process.exit(),
      }
    )
  ).newEmailAddress;

  const apiClient = new APIClient(backendURL, emailAddress, password);

  logger.info(`Logging in with email address "${emailAddress}" ...`);

  await apiClient.login();

  logger.info(`Requesting email change to "${newEmailAddress}" ...`);

  if (!dryRun) {
    await apiClient.putEmail({email: newEmailAddress!});
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
