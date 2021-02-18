import {Availability, GenericMessage} from '@wireapp/protocol-messaging';
import UUID from 'uuidjs';

import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress, getPassword} from '../util';

export interface SetAvailabilityStatusOptions extends CommonOptions {}

export async function setAvailabilityStatus({
  defaultBackendURL,
  dryRun,
  emailAddress,
  backendURL,
  password,
}: SetAvailabilityStatusOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  const apiClient = new APIClient(backendURL, emailAddress, password);

  console.info('Logging in ...');
  await apiClient.login();

  const {
    data: {team: teamId},
  } = await apiClient.getSelf();

  if (!teamId) {
    throw new Error('User is not part of a team on Wire.');
  }

  console.info('Setting availability status ...');

  const genericMessage = GenericMessage.create({
    availability: new Availability({type: Availability.Type.AVAILABLE}),
    messageId: UUID.genV4().toString(),
  });

  if (!dryRun) {
    await apiClient.broadcastGenericMessage(teamId, genericMessage, '');
  }
  await apiClient.logout();
}
