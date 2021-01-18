#!/usr/bin/env node

import commander from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import {deleteAllClients} from './commands/deleteAllClients';
import {resetPassword} from './commands/resetPassword';
import {setName} from './commands/setName';
import {getAllClients, updateClient} from './commands/updateOrGetClient';
import {tryAndExit} from './util';

const defaultPackageJsonPath = path.join(__dirname, 'package.json');
const packageJsonPath = fs.existsSync(defaultPackageJsonPath)
  ? defaultPackageJsonPath
  : path.join(__dirname, '../package.json');

const packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
const {description, name, version} = JSON.parse(packageJson);
const commanderOptions = commander.opts();

commander
  .name(name.replace(/^@.+\//, ''))
  .description(description)
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your Wire email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .version(version, '-v, --version')
  .on('command:*', args => {
    console.error(`\n  error: invalid command \`${args[0]}'\n`);
    process.exit(1);
  });

commander
  .command('delete-all-clients')
  .description('delete all clients')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      deleteAllClients({
        ...(commanderOptions.backend && {backendURL: commanderOptions.backend}),
        ...(commanderOptions.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions.password && {password: commanderOptions.password}),
      })
    )
  );

commander
  .command('set-client-label')
  .description(`update a client's label`)
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-i, --client-id <id>', `specify the client's ID`)
  .option('-l, --label <label>', 'specify the new label')
  .option('-t, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      updateClient({
        ...(commanderOptions.clientId && {clientId: commanderOptions.clientId}),
        ...(commanderOptions.label && {label: commanderOptions.label}),
        ...(commanderOptions.backend && {backendURL: commanderOptions.backend}),
        ...(commanderOptions.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions.password && {password: commanderOptions.password}),
      })
    )
  );

commander
  .command('reset-password')
  .description('reset your password')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-c, --continue', 'skip initiation (if you already received the password reset email)')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .action(() =>
    tryAndExit(() =>
      resetPassword({
        ...(commanderOptions.parent.backend && {backendURL: commanderOptions.parent.backend}),
        ...(commanderOptions.continue && {skipInitation: commanderOptions.continue}),
        ...(commanderOptions.parent.dryRun && {dryRun: commanderOptions.parent.dryRun}),
        ...(commanderOptions.parent.email && {emailAddress: commanderOptions.parent.email}),
      })
    )
  );

commander
  .command('get-all-clients')
  .description('get all clients data')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      getAllClients({
        ...(commanderOptions.parent.backend && {backendURL: commanderOptions.parent.backend}),
        ...(commanderOptions.parent.dryRun && {dryRun: commanderOptions.parent.dryRun}),
        ...(commanderOptions.parent.email && {emailAddress: commanderOptions.parent.email}),
        ...(commanderOptions.parent.password && {password: commanderOptions.parent.password}),
      })
    )
  );

commander
  .command('set-name')
  .description('set your name')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-n, --new-name <name>', 'specify your new name')
  .option('-p, --password <password>', 'specify your Wire password')
  .action(() =>
    tryAndExit(() =>
      setName({
        ...(commanderOptions.backend && {backendURL: commanderOptions.backend}),
        ...(commanderOptions.dryRun && {dryRun: commanderOptions.dryRun}),
        ...(commanderOptions.email && {emailAddress: commanderOptions.email}),
        ...(commanderOptions.newName && {name: commanderOptions.newName}),
        ...(commanderOptions.password && {password: commanderOptions.password}),
      })
    )
  );

commander.parse(process.argv);
