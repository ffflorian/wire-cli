import {login, putSelf} from './apiClient';
import {CommonOptions} from './CommonOptions';
import {ask} from './util';

export interface SetNameOptions extends CommonOptions {
  name?: string;
}

export async function setName({dryRun, emailAddress, backendURL, name}: SetNameOptions): Promise<void> {
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

  const {data: accessToken} = await login(backendURL, emailAddress, password);

  if (!name) {
    name = await ask('Enter your new name (max. 128 chars):', /.{1,128}/);
  }

  console.info('Setting new name ...');

  if (!dryRun) {
    await putSelf({name: name}, backendURL, accessToken);
  }
}
