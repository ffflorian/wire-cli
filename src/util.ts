import * as http from 'http';
import * as readline from 'readline';

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export interface RequestOptions {
  data?: any;
  headers?: Record<string, string>;
  method?: string;
  url: string;
  wantedStatusCode?: number;
}

export interface ResponseData {
  cookies: Record<string, string>;
  rawData: string;
}

export type Cookies = Record<string, string>;
export type TryFunction = () => any | Promise<any>;

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

export function ask(question: string, responseRegex: RegExp = /.+/): Promise<string> {
  return new Promise(resolve =>
    readlineInterface.question(`${question} `, answer =>
      resolve(responseRegex.test(answer) ? answer : ask(question, responseRegex))
    )
  );
}

export function pluralize(text: string, times: number, postfix: string = 's'): string {
  return `${text}${times === 1 ? '' : postfix}`;
}

export async function tryAndExit(fn: TryFunction): Promise<never> {
  let exitCode = 0;

  try {
    await fn();
  } catch (error) {
    console.error(error);
    exitCode = 1;
  }

  process.exit(exitCode);
}
