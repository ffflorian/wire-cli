# wire-cli [![Build Status](https://github.com/ffflorian/wire-cli/workflows/Build/badge.svg)](https://github.com/ffflorian/wire-cli/actions/) [![npm version](https://img.shields.io/npm/v/wire-cli.svg?style=flat)](https://www.npmjs.com/package/wire-cli)

Wire CLI

## Installation

Run `yarn global add wire-cli` or `npm install -g wire-cli`.

## Usage

```
yarn
yarn start
```

```
Usage: wire-cli [options] [command]

Wire CLI

Options:
  -b, --backend <URL>           specify the Wire backend URL (e.g.
                                "staging-nginz-https.zinfra.io")
  -d, --dry-run                 don't send any data (beside logging in and out)
  -e, --email <address>         specify your Wire email address
  -p, --password <password>     specify your Wire password
  -v, --version                 output the version number
  -h, --help                    display help for command

Commands:
  delete-all-clients [options]  delete all clients
  reset-password [options]      reset your password
  set-name [options]            set your name
  help [command]                display help for command
```

## Test

```
yarn
yarn test
```
