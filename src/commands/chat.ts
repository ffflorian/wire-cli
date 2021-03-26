import {CRUDEngine, MemoryEngine} from '@wireapp/store-engine';

import {APIClient} from '@wireapp/api-client/src/APIClient';
import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_COOKIE_KEY,
  AUTH_TABLE_NAME,
  AccessTokenData,
  Context,
  Cookie,
  LoginData,
} from '@wireapp/api-client/src/auth';
import {ClientType} from '@wireapp/api-client/src/client';
import {WebSocketClient} from '@wireapp/api-client/src/tcp';
import type {Config} from '@wireapp/api-client/src/Config';

import {CommonOptions} from '../CommonOptions';
import {getLogger, getBackendURL, getEmailAddress, getPassword, getWebSocketURL} from '../util';

const logger = getLogger('chat');

export interface ChatOptions extends CommonOptions {
  defaultWebSocketURL: string;
  webSocketURL?: string;
}

async function createContext(storeEngine: CRUDEngine, apiClient: APIClient, loginData: LoginData): Promise<Context> {
  try {
    const {expiration, zuid} = await storeEngine.read<Cookie>(AUTH_TABLE_NAME, AUTH_COOKIE_KEY);
    const cookie = new Cookie(zuid, expiration);
    logger.log(`Found cookie "${zuid}".`);
    logger.log('Logging in with existing cookie ...');
    const context = await apiClient.init(loginData.clientType, cookie);
    return context;
  } catch (error) {
    logger.log(`Logging in with new cookie ...`);
    return apiClient.login(loginData);
  }
}

export async function chat({
  defaultBackendURL,
  defaultWebSocketURL,
  emailAddress,
  backendURL,
  password,
  webSocketURL,
}: ChatOptions): Promise<void> {
  backendURL ||= await getBackendURL(defaultBackendURL);
  emailAddress ||= await getEmailAddress();
  password ||= await getPassword();
  webSocketURL ||= await getWebSocketURL(defaultWebSocketURL);

  const storeEngine = new MemoryEngine();
  await storeEngine.init('wire-cli');

  const apiConfig: Config = {
    urls: {
      name: 'backend',
      rest: backendURL,
      ws: webSocketURL,
    },
  };

  const apiClient = new APIClient(apiConfig);

  apiClient.on(APIClient.TOPIC.ACCESS_TOKEN_REFRESH, async (accessToken: AccessTokenData) => {
    await storeEngine.updateOrCreate(AUTH_TABLE_NAME, AUTH_ACCESS_TOKEN_KEY, accessToken);
    logger.log(`Saved access token`);
  });

  apiClient.on(APIClient.TOPIC.COOKIE_REFRESH, async (cookie?: Cookie) => {
    if (cookie) {
      const entity = {expiration: cookie.expiration, zuid: cookie.zuid};
      await storeEngine.updateOrCreate(AUTH_TABLE_NAME, AUTH_COOKIE_KEY, entity);
      logger.log(`Saved cookie`, cookie);
    }
  });

  await createContext(storeEngine, apiClient, {
    clientType: ClientType.TEMPORARY,
    email: emailAddress,
    password,
  });

  const self = await apiClient.self.api.getSelf();

  logger.log(`Got self user with ID "${self.id}" and name "${self.name}".`);

  const webSocketClient = await apiClient.connect();

  webSocketClient.on(WebSocketClient.TOPIC.ON_MESSAGE, notification => {
    logger.log('Received notification via WebSocket', notification);
  });
}
