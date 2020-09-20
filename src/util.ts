import * as readline from 'readline';
import * as http from 'http';
import * as https from 'https';
import {URL} from 'url';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';

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

export function request({
  data,
  headers,
  method = 'get',
  wantedStatusCode = HTTP_STATUS.OK,
  url,
}: RequestOptions): Promise<ResponseData> {
  const parsedURL = new URL(url);
  const httpAgent = parsedURL.protocol === 'https:' ? https : http;

  /** @type {import('http').RequestOptions} */
  const options = {
    headers: {
      ...(data && {'Content-Type': 'application/json;charset=UTF-8'}),
      ...headers,
    },
    host: parsedURL.host,
    method,
    path: parsedURL.pathname,
  };

  return new Promise((resolve, reject) => {
    const req = httpAgent
      .request(options, response => {
        let rawData = '';
        const cookies = parseCookies(response.headers);

        response
          .on('end', () =>
            resolve({
              cookies,
              rawData,
            })
          )
          .on('data', data => (rawData += data))
          .on('error', error => reject(error))
          .setEncoding('utf8');

        if (response.statusCode !== wantedStatusCode) {
          if (rawData) {
            console.info('Received data from server:', rawData);
          }
          const errorMessage = `Received status code "${response.statusCode}" but wanted "${wantedStatusCode}".`;
          response.resume();
          // eslint-disable-next-line prefer-promise-reject-errors
          return reject({code: response.statusCode, errorMessage});
        }
      })
      .on('error', error => reject(error));

    if (data) {
      if (method.toLowerCase() === 'delete') {
        req.useChunkedEncodingByDefault = true;
      }
      req.write(JSON.stringify(data));
    }

    req.end();
  });
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
