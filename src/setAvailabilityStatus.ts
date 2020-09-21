// import {Availability, GenericMessage} from '@wireapp/protocol-messaging';
// import UUID from 'uuidjs';

import {getSelf, login} from './apiClient';
import {CommonOptions} from './CommonOptions';
import {ask} from './util';

export interface SetAvailabilityStatusOptions extends CommonOptions {
  /** Your Wire password */
  password?: string;
}

export async function setAvailabilityStatus({
  // dryRun,
  emailAddress,
  backendURL,
  password,
}: SetAvailabilityStatusOptions): Promise<void> {
  if (!backendURL) {
    backendURL = await ask('Enter the backend URL (e.g. "staging-nginz-https.zinfra.io"):', /.+\..+/);
  }

  if (!backendURL.startsWith('https')) {
    backendURL = `https://${backendURL}`;
  }

  if (!emailAddress) {
    emailAddress = await ask('Enter your email address:', /.+@.+\..+/);
  }

  if (!password) {
    password = await ask('Enter the password for your account:');
  }

  console.info('Logging in ...');

  await login(backendURL, emailAddress, password);
  const {data: accessToken} = await login(backendURL, emailAddress, password);

  // const cookieString = `zuid=${cookies.zuid}`;

  console.info('Getting user data ...');

  const {team: teamId} = await getSelf(backendURL, accessToken);

  if (!teamId) {
    throw new Error('User is not part of a team on Wire.');
  }

  // const client = await getClient

  // console.info('Setting availability status ...');

  // const genericMessage = GenericMessage.create({
  //   availability: new Availability({type: Availability.Type.AVAILABLE}),
  //   messageId: UUID.genV4().toString(),
  // });

  // await broadcastGenericMessage(teamId, genericMessage, '', backendURL, accessToken);
}
