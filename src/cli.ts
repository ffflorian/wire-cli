#!/usr/bin/env node

import * as commander from 'commander';
import {deleteAllClients} from './deleteAllClients';
import {resetPassword} from './resetPassword';
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
  .action(async ({parent}: commander.Command) => {
    try {
      await deleteAllClients({
        ...(parent.backend && {backendURL: parent.backend}),
        ...(parent.dryRun && {dryRun: parent.dryRun}),
        ...(parent.email && {emailAddress: parent.email}),
      });
      process.exit();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

commander
  .command('reset-password')
  .description('reset your password')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-c, --continue', 'skip initiation (if you already received the password reset email)')
  .option('-d, --dry-run', `don't send any data (beside logging in and out)`)
  .option('-e, --email <address>', 'specify your email address')
  .action(async ({parent}: commander.Command) => {
    try {
      await resetPassword({
        ...(parent.backend && {backendURL: parent.backend}),
        ...(parent.continue && {skipInitation: parent.continue}),
        ...(parent.dryRun && {dryRun: parent.dryRun}),
        ...(parent.email && {emailAddress: parent.email}),
      });
      process.exit();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

commander.parse(process.argv);
