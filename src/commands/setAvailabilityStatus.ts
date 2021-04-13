import {Availability} from '@wireapp/protocol-messaging';
import {Account} from '@wireapp/core';
import {APIClient} from '@wireapp/api-client';
import {ClientClassification, ClientType} from '@wireapp/api-client/src/client/';
import prompts from 'prompts';
import * as path from 'path';
import * as fs from 'fs';

const defaultPackageJsonPath = path.join(__dirname, '../package.json');
const packageJsonPath = fs.existsSync(defaultPackageJsonPath)
  ? defaultPackageJsonPath
  : path.join(__dirname, '../../package.json');

const pkg = require(packageJsonPath);

import {CommonOptions} from '../CommonOptions';
import {getLogger, getBackendURL, getEmailAddress, getPassword, getWebSocketURL} from '../util';

const logger = getLogger('set-availability');

export interface SetAvailabilityStatusOptions extends CommonOptions {
  defaultWebSocketURL: string;
  statusType?: Availability.Type | string | number;
  webSocketURL?: string;
}

export async function setAvailabilityStatus({
  backendURL,
  defaultBackendURL,
  defaultWebSocketURL,
  dryRun,
  emailAddress,
  password,
  statusType,
  webSocketURL,
}: SetAvailabilityStatusOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  webSocketURL ||= await getWebSocketURL(defaultWebSocketURL);
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
      ws: webSocketURL,
    },
  });

  const account = new Account(apiClient);

  logger.info('Logging in ...');
  await account.login({clientType: ClientType.TEMPORARY, email: emailAddress, password}, undefined, {
    classification: ClientClassification.DESKTOP,
    cookieLabel: 'default',
    model: `${pkg.name} ${pkg.version}`,
  });

  const {team: teamId} = await account.service!.self.getSelf();

  if (!teamId) {
    throw new Error('User is not part of a team on Wire.');
  }

  logger.info('Setting availability status ...');

  if (!dryRun) {
    await account.service!.user.setAvailability(teamId, newStatusType);
  }

  logger.info('Logging out ...');
  await apiClient.logout();
}
