#!/usr/bin/env node

import * as commander from 'commander';
import {deleteAllClients} from './deleteAllClients';
import {resetPassword} from './resetPassword';
const {description, name, version} = require('../package.json');

commander
  .name(name.replace(/^@.+\//, ''))
  .description(description)
  .version(version, '-v, --version')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .on('command:*', args => {
    console.error(`\n  error: invalid command \`${args[0]}'\n`);
    process.exit(1);
  });

commander
  .command('delete-all-clients')
  .description('delete all clients')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .action(async ({parent}: commander.Command) => {
    try {
      await deleteAllClients({...(parent.backend && {backendURL: parent.backend})});
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

commander
  .command('reset-password')
  .description('reset your password')
  .option('-b, --backend <URL>', 'specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")')
  .option('-c, --continue', 'skip initiation')
  .action(async ({parent}: commander.Command) => {
    try {
      await resetPassword({
        ...(parent.backend && {backendURL: parent.backend}),
        ...(parent.continue && {skipInitation: parent.continue}),
      });
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

commander.parse(process.argv);
