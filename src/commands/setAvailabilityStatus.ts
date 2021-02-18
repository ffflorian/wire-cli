import {Availability, GenericMessage} from '@wireapp/protocol-messaging';
import UUID from 'uuidjs';

import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getLogger, getBackendURL, getEmailAddress, getPassword} from '../util';

const logger = getLogger('set-availability');

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

  logger.info('Logging in ...');
  await apiClient.login();

  const {
    data: {team: teamId},
  } = await apiClient.getSelf();

  if (!teamId) {
    throw new Error('User is not part of a team on Wire.');
  }

  logger.info('Setting availability status ...');

  const genericMessage = GenericMessage.create({
    availability: new Availability({type: Availability.Type.AVAILABLE}),
    messageId: UUID.genV4().toString(),
  });

  if (!dryRun) {
    await apiClient.broadcastGenericMessage(teamId, genericMessage, '');
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
