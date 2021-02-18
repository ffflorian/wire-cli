import {Availability, GenericMessage} from '@wireapp/protocol-messaging';
import prompts from 'prompts';
import UUID from 'uuidjs';

import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getLogger, getBackendURL, getEmailAddress, getPassword} from '../util';

const logger = getLogger('set-availability');

export interface SetAvailabilityStatusOptions extends CommonOptions {
  statusType?: Availability.Type;
}

export async function setAvailabilityStatus({
  defaultBackendURL,
  dryRun,
  emailAddress,
  backendURL,
  password,
  statusType,
}: SetAvailabilityStatusOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();
  statusType ??= (
    await prompts(
      {
        choices: [
          {
            title: 'None',
            value: Availability.Type.NONE,
          },
          {
            title: 'Available',
            value: Availability.Type.AVAILABLE,
          },
          {
            title: 'Busy',
            value: Availability.Type.BUSY,
          },
          {
            title: 'Away',
            value: Availability.Type.AWAY,
          },
        ],
        message: 'Which status would you like to set?',
        name: 'status',
        type: 'select',
      },
      {onCancel: () => process.exit()}
    )
  ).status;

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
    availability: new Availability({type: statusType!}),
    messageId: UUID.genV4().toString(),
  });

  if (!dryRun) {
    await apiClient.broadcastGenericMessage(teamId, genericMessage, '');
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
