# wire-cli [![Build Status](https://github.com/ffflorian/wire-cli/workflows/Build/badge.svg)](https://github.com/ffflorian/wire-cli/actions/) [![npm version](https://img.shields.io/npm/v/wire-cli.svg?style=flat)](https://www.npmjs.com/package/wire-cli)

A [Wire](https://github.com/wireapp) CLI.

## Installation

Run `yarn global add wire-cli` or `npm install -g wire-cli`.

To run the CLI without installing, just run `npx wire-cli`.

## Local usage

```
yarn
yarn start
```

```
Usage: wire-cli [options] [command]

A Wire CLI.

Options:
  -b, --backend <URL>           specify the Wire backend URL
  -d, --dry-run                 don't send any data (beside logging in and out)
  -e, --email <address>         specify your Wire email address
  -p, --password <password>     specify your Wire password
  -v, --version                 output the version number
  -h, --help                    display help for command

Commands:
  delete-all-clients [options]  delete all clients
  set-client-label [options]    update a client's label
  reset-password [options]      reset your password
  get-all-clients [options]     get all clients data
  set-name [options]            set your name
  set-email [options]           set your email address
  set-availability [options]    set your availability status
  send [options]                send a message
  delete [options]              delete a message
  help [command]                display help for command
```

## Test

```
yarn
yarn test
```
