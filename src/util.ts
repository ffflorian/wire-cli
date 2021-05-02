import * as http from 'http';
import prompts from 'prompts';
import logdown = require('logdown');

export type Cookies = Record<string, string>;
export type TryFunction = () => any | Promise<any>;

const logger = getLogger('util');

export function parseCookies(rawHeaders: http.IncomingHttpHeaders): Cookies {
  const cookies: Cookies = {};
  const cookieRegex = /(?<id>[^=]+)=(?<content>[^;]+)/;
  const addCookie = (cookieString: string) => {
    const regexResults = cookieRegex.exec(cookieString);
    if (regexResults && regexResults.groups) {
      cookies[regexResults.groups.id] = regexResults.groups.content;
    }
  };
  const cookieHeader = rawHeaders['set-cookie'] || rawHeaders['Set-Cookie'];
  if (cookieHeader) {
    if (Array.isArray(cookieHeader)) {
      cookieHeader.forEach(cookieString => addCookie(cookieString));
    } else {
      addCookie(cookieHeader);
    }
  }
  return cookies;
}

export async function getBackendURL(defaultBackendURL?: string): Promise<string> {
  let {backendURL} = await prompts(
    {
      initial: defaultBackendURL,
      message: 'Enter the backend URL',
      name: 'backendURL',
      type: 'text',
      validate: input => input.match(/(https?)?.+\..+/),
    },
    {
      onCancel: () => process.exit(),
    }
  );

  // backendURL ||= defaultBackendURL;
  backendURL = addHTTPS(backendURL);

  logger.info(`Using "${backendURL}" as backend.`);

  return backendURL;
}

export async function getConversationID(): Promise<string> {
  const {conversationID} = await prompts(
    {
      message: 'Enter the conversation ID',
      name: 'conversationID',
      type: 'text',
      validate: input => isUUID(input),
    },
    {
      onCancel: () => process.exit(),
    }
  );

  return conversationID;
}

export async function getMessageID(): Promise<string> {
  const {messageID} = await prompts(
    {
      message: 'Enter the message ID',
      name: 'messageID',
      type: 'text',
      validate: input => isUUID(input),
    },
    {
      onCancel: () => process.exit(),
    }
  );

  return messageID;
}

export async function getEmailAddress(): Promise<string> {
  const {emailAddress} = await prompts(
    {
      hint: 'Email address must be in the format email@example.com',
      message: 'Enter your Wire email address',
      name: 'emailAddress',
      type: 'text',
      validate: input => input.match(/.+@.+\..+/),
    },
    {
      onCancel: () => process.exit(),
    }
  );

  logger.info(`Using "${emailAddress}" as email address.`);

  return emailAddress;
}

export async function getPassword(): Promise<string> {
  const {password} = await prompts(
    {
      message: 'Enter your Wire password',
      name: 'password',
      type: 'password',
    },
    {
      onCancel: () => process.exit(),
    }
  );
  return password;
}

export function pluralize(text: string, times: number, postfix: string = 's'): string {
  return `${text}${times === 1 ? '' : postfix}`;
}

export async function tryAndExit(fn: TryFunction): Promise<never> {
  let exitCode = 0;

  try {
    await fn();
  } catch (error) {
    logger.error(error);
    exitCode = 1;
  }

  process.exit(exitCode);
}

export function getLogger(moduleName: string): logdown.Logger {
  const logger = logdown(`wire-cli/${moduleName}`, {logger: console, markdown: false});
  logger.state.isEnabled = true;
  return logger;
}

export function addHTTPS(url?: string): string {
  return url ? `https://${url.replace(/^https?:\/\//, '')}` : '';
}

export function isUUID(input: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input);
}
