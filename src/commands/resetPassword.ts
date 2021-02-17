import {StatusCodes as HTTP_STATUS} from 'http-status-codes';
import prompts from 'prompts';

import {APIClient} from '../APIClient';
import {CommonOptions} from '../CommonOptions';
import {getBackendURL, getEmailAddress} from '../util';

export interface ResetPasswordOptions extends CommonOptions {
  /** If you already received the password reset email */
  skipInitation?: boolean;
}

export async function resetPassword({
  defaultBackendURL,
  skipInitation,
  dryRun,
  emailAddress,
  backendURL,
}: ResetPasswordOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();

  const apiClient = new APIClient(backendURL, emailAddress, '');

  if (!skipInitation) {
    console.info('Initiating password reset ...');
    try {
      if (!dryRun) {
        await apiClient.initatePasswordReset();
      }
    } catch (error) {
      if (error.code === HTTP_STATUS.CONFLICT) {
        const {shouldContinue} = await prompts(
          {
            message: 'A password reset is already in progress. Would you like to continue?',
            name: 'shouldContinue',
            type: 'confirm',
          },
          {
            onCancel: () => process.exit(),
          }
        );

        if (!shouldContinue) {
          process.exit();
        }
      } else {
        throw error;
      }
    }
  }

  const {resetCode} = await prompts(
    {
      message: 'Enter the password reset code you received via email:',
      name: 'resetCode',
      type: 'text',
    },
    {
      onCancel: () => process.exit(),
    }
  );

  const {newPassword} = await prompts(
    {
      message: 'Enter the new password for your account:',
      name: 'newPassword',
      type: 'password',
    },
    {
      onCancel: () => process.exit(),
    }
  );

  console.info('Completing password reset ...');

  if (!dryRun) {
    await apiClient.completePasswordReset(resetCode, newPassword);
  }
}
