import {completePasswordReset, initatePasswordReset} from './client';
import {ask} from './util';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';

export async function resetPassword({
  skipInitation,
  backendURL,
}: {
  backendURL?: string;
  skipInitation?: boolean;
}): Promise<void> {
  if (!backendURL) {
    backendURL = await ask('Enter the backend URL (e.g. "staging-nginz-https.zinfra.io"):', /.+\..+/);
  }

  if (!backendURL.startsWith('https')) {
    backendURL = `https://${backendURL}`;
  }

  const emailAddress = await ask('Enter your email address:', /.+@.+\..+/);

  if (!skipInitation) {
    console.info('Initiating password reset ...');
    try {
      await initatePasswordReset(emailAddress, backendURL);
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

  await completePasswordReset(resetCode, emailAddress, newPassword, backendURL);
}
