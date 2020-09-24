import {APIClient} from './apiClient';
import {CommonOptions} from './CommonOptions';
import {ask} from './util';

export interface SetNameOptions extends CommonOptions {
  name?: string;
}

export async function setName({dryRun, emailAddress, backendURL, name, password}: SetNameOptions): Promise<void> {
  if (!backendURL) {
    backendURL = await ask('Enter the backend URL (e.g. "staging-nginz-https.zinfra.io"):', /.+\..+/);
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

  if (!name) {
    name = await ask('Enter your new name (max. 128 chars):', /.{1,128}/);
  }

  console.info('Setting new name ...');

  if (!dryRun) {
    await apiClient.putSelf({name: name});
  }
}
