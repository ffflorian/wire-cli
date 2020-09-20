#!/usr/bin/env node

import * as commander from 'commander';
const {description, name, version} = require('../package.json');

commander
  .name(name.replace(/^@.+\//, ''))
  .description(description)
  .version(version, '-v, --version')
  .parse(process.argv);
