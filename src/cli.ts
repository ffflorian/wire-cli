#!/usr/bin/env node

import * as commander from 'commander';

import {deleteAllClients} from './deleteAllClients';
import {resetPassword} from './resetPassword';
import {setName} from './setName';
import {tryAndExit} from './util';

const {description, name, version} = require('../package.json');

commander
  .name(name.replace(/^@.+\//, ''))
  .description(description)
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
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
  .action(({parent}: commander.Command) =>
    tryAndExit(() =>
      deleteAllClients({
        ...(parent.backend && {backendURL: parent.backend}),
        ...(parent.dryRun && {dryRun: parent.dryRun}),
        ...(parent.email && {emailAddress: parent.email}),
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
  .command('set-name')
  .description('set your name')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .option('-n, --new-name <name>', 'specify your new name')
  .action(({newName, parent}: commander.Command) =>
    tryAndExit(() =>
      setName({
        ...(parent.backend && {backendURL: parent.backend}),
        ...(parent.dryRun && {dryRun: parent.dryRun}),
        ...(parent.email && {emailAddress: parent.email}),
        ...(newName && {name: newName}),
      })
    )
  );

commander.parse(process.argv);
