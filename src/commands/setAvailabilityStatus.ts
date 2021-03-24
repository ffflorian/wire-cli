import {Availability} from '@wireapp/protocol-messaging';
import {Account} from '@wireapp/core';
import {APIClient} from '@wireapp/api-client';
import {ClientType} from '@wireapp/api-client/src/client/';
import prompts from 'prompts';

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

  const apiClient = new APIClient({
    urls: {
      name: 'backend',
      rest: backendURL,
      ws: `wss://${backendURL.replace(/https?:\/\//, '')}`,
    },
  });

  const account = new Account(apiClient);

  logger.info('Logging in ...');
  await account.login({clientType: ClientType.TEMPORARY, email: emailAddress, password});

  const {team: teamId} = await account.service!.self.getSelf();

  if (!teamId) {
    throw new Error('User is not part of a team on Wire.');
  }

  logger.info('Setting availability status ...');

  if (!dryRun) {
    await account.service!.user.setAvailability(teamId, statusType!);
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
