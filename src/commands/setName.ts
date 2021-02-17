import prompts from 'prompts';
import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getPassword} from '../util';

export interface SetNameOptions extends CommonOptions {
  name?: string;
}

export async function setName({
  defaultBackendURL,
  dryRun,
  emailAddress,
  backendURL,
  name,
  password,
}: SetNameOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  console.info('Logging in ...');

  await apiClient.login();

  if (!name) {
    const response = await prompts(
      {max: 128, message: 'Enter your new name (max. 128 chars):', name: 'newName', type: 'text'},
      {
        onCancel: () => process.exit(),
      }
    );
    name = response.newName as string;
  }

  console.info('Setting new name ...');

  if (!dryRun) {
    await apiClient.putSelf({name});
  }
}
