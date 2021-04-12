#!/usr/bin/env node

import commander from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import {
  deleteAllClients,
  getAllClients,
  resetPassword,
  setAvailabilityStatus,
  setName,
  updateClient,
} from './commands/';
import {CommonOptions} from './CommonOptions';
import {addHTTPS, addWSS, getLogger, tryAndExit} from './util';

const defaultPackageJsonPath = path.join(__dirname, 'package.json');
const packageJsonPath = fs.existsSync(defaultPackageJsonPath)
  ? defaultPackageJsonPath
  : path.join(__dirname, '../package.json');

const {description, name, version} = require(packageJsonPath);
const commanderOptions = commander.opts();
const defaultWebSocketURL = 'wss://staging-nginz-ssl.zinfra.io';

const defaultOptions: CommonOptions = {
  defaultBackendURL: 'https://staging-nginz-https.zinfra.io',
};

const logger = getLogger('cli');

commander
  .name(name.replace(/^@.+\//, ''))
  .description(description)
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultOptions.defaultBackendURL}")`)
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
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultOptions.defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      deleteAllClients({
        ...defaultOptions,
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions?.password && {password: commanderOptions.password}),
      })
    )
  );

commander
  .command('set-client-label')
  .description(`update a client's label`)
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultOptions.defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-i, --client-id <id>', `specify the client's ID`)
  .option('-l, --label <label>', 'specify the new label')
  .option('-t, --password <password>', 'specify your Wire password')
  .action(localOptions =>
    tryAndExit(() =>
      updateClient({
        ...defaultOptions,
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions?.password && {password: commanderOptions.password}),
        ...(localOptions?.clientId && {clientId: localOptions.clientId}),
        ...(localOptions?.label && {label: localOptions.label}),
      })
    )
  );

commander
  .command('reset-password')
  .description('reset your password')
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultOptions.defaultBackendURL}")`)
  .option('-c, --continue', 'skip initiation (if you already received the password reset email)')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .action(() =>
    tryAndExit(() =>
      resetPassword({
        ...defaultOptions,
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.continue && {skipInitation: commanderOptions.continue}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
      })
    )
  );

commander
  .command('get-all-clients')
  .description('get all clients data')
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultOptions.defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      getAllClients({
        ...defaultOptions,
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions?.password && {password: commanderOptions.password}),
      })
    )
  );

commander
  .command('set-name')
  .description('set your name')
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultOptions.defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-n, --new-name <name>', 'specify your new name')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(localOptions =>
    tryAndExit(() =>
      setName({
        ...defaultOptions,
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions?.password && {password: commanderOptions.password}),
        ...(localOptions?.newName && {newName: localOptions.newName}),
      })
    )
  );

commander
  .command('set-availability')
  .description('set your availability status')
  .option('-b, --backend <URL>', `specify the Wire backend URL (default: "${defaultOptions.defaultBackendURL}")`)
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-s, --status <number>', 'specify the status type to be set (0/1/2/3 or none/available/away/busy)')
  .option('-p, --password <password>', 'specify your Wire password')
  .option('-w, --websocket <URL>', `specify the Wire WebSocket URL (default: "${defaultWebSocketURL}")`)
  .action(localOptions =>
    tryAndExit(() =>
      setAvailabilityStatus({
        defaultWebSocketURL,
        ...defaultOptions,
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions?.password && {password: commanderOptions.password}),
        ...(localOptions?.websocket && {webSocketURL: addWSS(localOptions.websocket)}),
        ...(localOptions?.status && {statusType: localOptions.status}),
      })
    )
  );

commander.parse(process.argv);
