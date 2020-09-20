# wire-cli [![Build Status](https://github.com/ffflorian/wire-cli/workflows/Build/badge.svg)](https://github.com/ffflorian/wire-cli/actions/)

Wire CLI tools

## Installation

Run `yarn global add @ffflorian/wire-cli` or `npm install -g @ffflorian/wire-cli`.

## Usage

```
yarn
yarn start
```

```
Usage: wire-cli [options] [command]

Wire CLI tools

Options:
  -b, --backend <URL>           specify the Wire backend URL (e.g. "staging-nginz-https.zinfra.io")
  -d, --dry-run                 don't send any data (beside logging in and out)
  -e, --email <address>         specify your email address
  -v, --version                 output the version number
  -h, --help                    display help for command

Commands:
  delete-all-clients [options]  delete all clients
  reset-password [options]      reset your password
  help [command]                display help for command
```

## Test

```
yarn
yarn test
```
