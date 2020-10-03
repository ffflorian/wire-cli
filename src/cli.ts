#!/usr/bin/env node

import * as commander from 'commander';
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
  .action(({parent}: commander.Command) =>
    tryAndExit(() =>
      deleteAllClients({
        ...(parent.backend && {backendURL: parent.backend}),
        ...(parent.dryRun && {dryRun: parent.dryRun}),
        ...(parent.email && {emailAddress: parent.email}),
        ...(parent.password && {password: parent.password}),
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
  .action(({clientId, label, parent}: commander.Command) =>
    tryAndExit(() =>
      updateClient({
        ...(clientId && {clientId}),
        ...(label && {label}),
        ...(parent.backend && {backendURL: parent.backend}),
        ...(parent.dryRun && {dryRun: parent.dryRun}),
        ...(parent.email && {emailAddress: parent.email}),
        ...(parent.password && {password: parent.password}),
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
  .action((command: commander.Command) =>
    tryAndExit(() =>
      resetPassword({
        ...(command.parent.backend && {backendURL: command.parent.backend}),
        ...(command.continue && {skipInitation: command.continue}),
        ...(command.parent.dryRun && {dryRun: command.parent.dryRun}),
        ...(command.parent.email && {emailAddress: command.parent.email}),
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
  .action((command: commander.Command) =>
    tryAndExit(() =>
      getAllClients({
        ...(command.parent.backend && {backendURL: command.parent.backend}),
        ...(command.parent.dryRun && {dryRun: command.parent.dryRun}),
        ...(command.parent.email && {emailAddress: command.parent.email}),
        ...(command.parent.password && {password: command.parent.password}),
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
  .action(({newName, parent}: commander.Command) =>
    tryAndExit(() =>
      setName({
        ...(parent.backend && {backendURL: parent.backend}),
        ...(parent.dryRun && {dryRun: parent.dryRun}),
        ...(parent.email && {emailAddress: parent.email}),
        ...(newName && {name: newName}),
        ...(parent.password && {password: parent.password}),
      })
    )
  );

commander.parse(process.argv);
