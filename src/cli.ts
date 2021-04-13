#!/usr/bin/env node

import commander from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import {
  deleteAllClients,
  deleteMessage,
  getAllClients,
  resetPassword,
  sendMessage,
  setAvailabilityStatus,
  setName,
  updateClient,
} from './commands/';
import {addHTTPS, addWSS, getLogger, tryAndExit} from './util';

const defaultPackageJsonPath = path.join(__dirname, 'package.json');
const packageJsonPath = fs.existsSync(defaultPackageJsonPath)
  ? defaultPackageJsonPath
  : path.join(__dirname, '../package.json');

const {description, name, version} = require(packageJsonPath);
const commanderOptions = commander.opts();
const defaultWebSocketURL = 'staging-nginz-ssl.zinfra.io';
const defaultBackendURL = 'staging-nginz-https.zinfra.io';

const logger = getLogger('cli');

commander
  .name(name.replace(/^@.+\//, ''))
  .description(description)
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
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
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
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
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-i, --client-id <id>', `specify the client's ID`)
  .option('-l, --label <label>', 'specify the new label')
  .option('-t, --password <password>', 'specify your Wire password')
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
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
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
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
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
  .command('set-name')
  .description('set your name')
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
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
  .command('set-availability')
  .description('set your availability status')
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .option('-s, --status <number>', 'specify the status type to be set (0/1/2/3 or none/available/away/busy)')
  .option('-w, --websocket <URL>', `specify the Wire WebSocket URL (default: "${defaultWebSocketURL}")`)
  .action((localOptions: {status?: string; websocket?: string} | undefined) =>
    tryAndExit(() =>
      setAvailabilityStatus({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        defaultWebSocketURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        password: commanderOptions.password,
        statusType: localOptions?.status,
        webSocketURL: addWSS(localOptions?.websocket),
      })
    )
  );

commander
  .command('send')
  .description('send a message')
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .option('-c, --conversation <ID>', 'specify the conversation for the message to be sent to')
  .option('-m, --message <text>', 'specify the message to be sent')
  .option('-w, --websocket <URL>', `specify the Wire WebSocket URL (default: "${defaultWebSocketURL}")`)
  .action((localOptions: {conversation?: string; message?: string; websocket?: string} | undefined) =>
    tryAndExit(() =>
      sendMessage({
        backendURL: addHTTPS(commanderOptions.backend),
        conversationID: localOptions?.conversation,
        defaultBackendURL,
        defaultWebSocketURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        message: localOptions?.message,
        password: commanderOptions.password,
        webSocketURL: addWSS(localOptions?.websocket),
      })
    )
  );

commander
  .command('delete')
  .description('delete a message')
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .option('-w, --websocket <URL>', `specify the Wire WebSocket URL (default: "${defaultWebSocketURL}")`)
  .option('-c, --conversation <ID>', 'specify the conversation in which the message should be deleted')
  .option('-m, --message <ID>', 'specify the message ID to be deleted')
  .action((localOptions: {conversation?: string; message?: string; websocket?: string} | undefined) =>
    tryAndExit(() =>
      deleteMessage({
        backendURL: addHTTPS(commanderOptions.backend),
        defaultBackendURL,
        defaultWebSocketURL,
        dryRun: commanderOptions.dryRun,
        emailAddress: commanderOptions.email,
        messageID: localOptions?.message,
        password: commanderOptions.password,
        webSocketURL: addWSS(localOptions?.websocket),
      })
    )
  );

commander.parse(process.argv);
