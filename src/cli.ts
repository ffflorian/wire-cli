#!/usr/bin/env node

import {program as commander} from 'commander';

import {
  deleteAllClients,
  deleteMessage,
  getAllClients,
  getSelf,
  resetPassword,
  sendMessage,
  setAvailabilityStatus,
  setName,
  updateClient,
} from './commands/';
import {setEmail} from './commands/setEmail';
import {addHTTPS, getLogger, tryAndExit, getPackageJson} from './util';

const {bin, description, version} = getPackageJson();
const commanderOptions = commander.opts();
const defaultBackendURL = 'staging-nginz-https.zinfra.io';

const logger = getLogger('cli');

commander
  .name(Object.keys(bin)[0])
  .description(description)
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .version(version, '-v, --version')
  .on('command:*', args => {
    logger.error(`\n  error: invalid command \`${args[0]}'\n`);
    process.exit(1);
  });

commander
  .command('delete-all-clients')
  .description('delete all clients')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      deleteAllClients({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        password: commanderOptions.password,
      })
    )
  );

commander
  .command('set-client-label')
  .description(`update a client's label`)
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-i, --client-id <id>', `specify the client's ID`)
  .option('-l, --label <label>', 'specify the new label')
  .option('-p, --password <password>', 'specify your Wire password')
  .action((localOptions: {clientId?: string; label?: string} | undefined) =>
    tryAndExit(() =>
      updateClient({
        backendURL: addHTTPS(commanderOptions.backend),
        clientId: localOptions?.clientId!,
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        label: localOptions?.label!,
        password: commanderOptions.password,
      })
    )
  );

commander
  .command('reset-password')
  .description('reset your password')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-c, --continue', 'skip initiation (if you already received the password reset email)')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .action(() =>
    tryAndExit(() =>
      resetPassword({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        skipInitation: commanderOptions.continue,
      })
    )
  );

commander
  .command('get-all-clients')
  .description('get all clients data')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      getAllClients({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        password: commanderOptions.password,
      })
    )
  );

commander
  .command('get-self')
  .description('get self data')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      getSelf({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        password: commanderOptions.password,
      })
    )
  );

commander
  .command('set-name')
  .description('set your name')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-n, --new-name <name>', 'specify your new name')
  .option('-p, --password <password>', 'specify your Wire password')
  .action((localOptions: {newName?: string} | undefined) =>
    tryAndExit(() =>
      setName({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        newName: localOptions?.newName,
        password: commanderOptions.password,
      })
    )
  );

commander
  .command('set-email')
  .description('set your email address')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-n, --new-email <address>', 'specify your new email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action((localOptions: {newEmail?: string} | undefined) =>
    tryAndExit(() =>
      setEmail({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        newEmailAddress: localOptions?.newEmail,
        password: commanderOptions.password,
      })
    )
  );

commander
  .command('set-availability')
  .description('set your availability status')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .option('-s, --status <status>', 'specify the status type to be set (0/1/2/3 or none/available/away/busy)')
  .action((localOptions: {status?: string} | undefined) =>
    tryAndExit(() =>
      setAvailabilityStatus({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        password: commanderOptions.password,
        statusType: localOptions?.status,
      })
    )
  );

commander
  .command('send')
  .description('send a message')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .option('-c, --conversation <ID>', 'specify the conversation for the message to be sent to')
  .option('-m, --message <text>', 'specify the message to be sent')
  .action((localOptions: {conversation?: string; message?: string} | undefined) =>
    tryAndExit(() =>
      sendMessage({
        backendURL: addHTTPS(commanderOptions.backend),
        conversationID: localOptions?.conversation,
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        message: localOptions?.message,
        password: commanderOptions.password,
      })
    )
  );

commander
  .command('delete')
  .description('delete a message')
  .option('-b, --backend <URL>', 'specify the Wire backend URL')
  .option('-c, --conversation <ID>', 'specify the conversation in which the message should be deleted')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-m, --message <ID>', 'specify the message ID to be deleted')
  .option('-p, --password <password>', 'specify your Wire password')
  .action((localOptions: {conversation?: string; message?: string} | undefined) =>
    tryAndExit(() =>
      deleteMessage({
        backendURL: addHTTPS(commanderOptions.backend),
        conversationID: localOptions?.conversation,
        defaultBackendURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        messageID: localOptions?.message,
        password: commanderOptions.password,
      })
    )
  );

commander.parse(process.argv);
