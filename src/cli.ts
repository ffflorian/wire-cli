import commander from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import {
  chat,
  deleteAllClients,
  getAllClients,
  resetPassword,
  setAvailabilityStatus,
  setName,
  updateClient,
} from './commands/';
import {CommonOptions} from './CommonOptions';
import {addHTTPS, getLogger, tryAndExit} from './util';

const defaultPackageJsonPath = path.join(__dirname, 'package.json');
const packageJsonPath = fs.existsSync(defaultPackageJsonPath)
  ? defaultPackageJsonPath
  : path.join(__dirname, '../package.json');

const packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
const {description, name, version} = JSON.parse(packageJson);
const commanderOptions = commander.opts();

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
  .action(() =>
    tryAndExit(() =>
      updateClient({
        ...defaultOptions,
        ...(commanderOptions?.clientId && {clientId: commanderOptions.clientId}),
        ...(commanderOptions?.label && {label: commanderOptions.label}),
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions?.password && {password: commanderOptions.password}),
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
  .action(() =>
    tryAndExit(() =>
      setName({
        ...defaultOptions,
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions?.newName && {name: commanderOptions.newName}),
        ...(commanderOptions?.password && {password: commanderOptions.password}),
      })
    )
  );

commander
  .command('set-availability')
  .description('set your availability status')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-s, --status <number>', 'specify the status type to be set')
  .option('-p, --password <password>', 'specify your Wire password')
  .option('-w, --websocket <URL>', 'specify the Wire websocket URL (e.g. "staging-nginz-ssl.zinfra.io")')
  .action(localOptions =>
    tryAndExit(() =>
      setAvailabilityStatus({
        ...defaultOptions,
        defaultWebSocketURL: 'wss://staging-nginz-ssl.zinfra.io',
        ...(commanderOptions?.backend && {backendURL: addHTTPS(commanderOptions.backend)}),
        ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions?.password && {password: commanderOptions.password}),
        ...(localOptions?.websocket && {webSocketURL: localOptions.websocket}),
        ...(typeof localOptions?.status !== 'undefined' && {statusType: localOptions.status}),
      })
    )
  );

commander
  .command('chat')
  .description('chat with others')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    chat({
      ...defaultOptions,
      ...(commanderOptions?.backend && {backendURL: commanderOptions.backend}),
      ...(commanderOptions?.dryRun && {dryRun: commanderOptions.dryRun}),
      ...(commanderOptions?.email && {emailAddress: commanderOptions.email}),
      ...(commanderOptions?.password && {password: commanderOptions.password}),
    })
  );

commander.parse(process.argv);
