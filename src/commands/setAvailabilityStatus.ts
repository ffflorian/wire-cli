import {Availability} from '@wireapp/protocol-messaging';
import {Account} from '@wireapp/core';
import {APIClient} from '@wireapp/api-client';
import {ClientClassification, ClientType} from '@wireapp/api-client/src/client/';
import prompts from 'prompts';

import {CommonOptions} from '../CommonOptions';
import {getLogger, getBackendURL, getEmailAddress, getPassword, getPackageJson} from '../util';

const logger = getLogger('set-availability');
const {name, version} = getPackageJson();

export interface SetAvailabilityStatusOptions extends CommonOptions {
  statusType?: Availability.Type | string | number;
}

export async function setAvailabilityStatus({
  backendURL,
  defaultBackendURL,
  dryRun,
  emailAddress,
  password,
  statusType,
}: SetAvailabilityStatusOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();

  let newStatusType: Availability.Type;

  if (typeof statusType === 'string' && !isNaN(Number(statusType.trim()))) {
    newStatusType = Number(statusType.trim());
  } else if (typeof statusType === 'string' && statusType.trim() !== '') {
    switch (statusType.toUpperCase()) {
      case 'NONE': {
        newStatusType = Availability.Type.NONE;
        break;
      }
      case 'AVAILABLE': {
        newStatusType = Availability.Type.AVAILABLE;
        break;
      }
      case 'AWAY': {
        newStatusType = Availability.Type.AWAY;
        break;
      }
      case 'BUSY': {
        newStatusType = Availability.Type.BUSY;
        break;
      }
      default: {
        console.warn(`Invalid status type "${statusType}" set.`);
      }
    }
  }

  newStatusType ??= (
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
            title: 'Away',
            value: Availability.Type.AWAY,
          },
          {
            title: 'Busy',
            value: Availability.Type.BUSY,
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
      ws: 'none',
    },
  });

  const account = new Account(apiClient);

  logger.info(`Logging in with email address "${emailAddress}" ...`);
  await account.login({clientType: ClientType.TEMPORARY, email: emailAddress, password}, undefined, {
    classification: ClientClassification.DESKTOP,
    cookieLabel: 'default',
    model: `${name} v${version}`,
  });

  const {team: teamId} = await account.service!.self.getSelf();

  if (!teamId) {
    throw new Error('User is not part of a team on Wire.');
  }

  logger.info(`Setting availability status to "${Availability.Type[newStatusType].toLowerCase()}" ...`);

  if (!dryRun) {
    await account.service!.user.setAvailability(teamId, newStatusType);
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
