import {StatusCodes as HTTP_STATUS} from 'http-status-codes';

import {completePasswordReset, initatePasswordReset} from './apiClient';
import {CommonOptions} from './CommonOptions';
import {ask} from './util';

export interface ResetPasswordOptions extends CommonOptions {
  /** If you already received the password reset email */
  skipInitation?: boolean;
}

export async function resetPassword({
  skipInitation,
  dryRun,
  emailAddress,
  backendURL,
}: ResetPasswordOptions): Promise<void> {
  if (!backendURL) {
    backendURL = await ask('Enter the backend URL (e.g. "staging-nginz-https.zinfra.io"):', /.+\..+/);
  }

  if (!backendURL.startsWith('https')) {
    backendURL = `https://${backendURL}`;
  }

  if (!emailAddress) {
    emailAddress = await ask('Enter your email address:', /.+@.+\..+/);
  }

  if (!skipInitation) {
    console.info('Initiating password reset ...');
    try {
      if (!dryRun) {
        await initatePasswordReset(emailAddress, backendURL);
      }
    } catch (error) {
      if (error.code === HTTP_STATUS.CONFLICT) {
        const shouldContinue = await ask(
          'A password reset is already in progress. Would you like to continue? [Y/n]',
          /^(y(?:es)?|no?)?$/i
        );

        if (/no?/i.test(shouldContinue)) {
          process.exit(1);
        }
      } else {
        throw error;
      }
    }
  }

  const resetCode = await ask('Enter the password reset code you received via email:');
  const newPassword = await ask('Enter the new password for your account:');

  console.info('Completing password reset ...');

  if (!dryRun) {
    await completePasswordReset(resetCode, emailAddress, newPassword, backendURL);
  }
}
