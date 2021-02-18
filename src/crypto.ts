import {OTRRecipients} from '@wireapp/api-client/src/conversation';
import {UserPreKeyBundleMap} from '@wireapp/api-client/src/user';
import {SessionPayloadBundle} from '@wireapp/core/src/main/cryptography/';
import {PreKey as SerializedPreKey} from '@wireapp/api-client/src/auth/';
import {Cryptobox} from '@wireapp/cryptobox';
import {MemoryEngine} from '@wireapp/store-engine';

import {getLogger} from './util';

const logger = getLogger('crypto');

export async function encryptMessage(
  plainText: Uint8Array,
  preKeyBundles: UserPreKeyBundleMap
): Promise<OTRRecipients<Uint8Array>> {
  const recipients: OTRRecipients<Uint8Array> = {};
  const encryptions: Array<Promise<SessionPayloadBundle>> = [];

  for (const userId in preKeyBundles) {
    recipients[userId] = {};

    for (const clientId in preKeyBundles[userId]) {
      const preKeyPayload: SerializedPreKey = preKeyBundles[userId][clientId];
      const preKey = preKeyPayload.key;
      const sessionId = `${userId}@${clientId}`;
      encryptions.push(encryptPayloadForSession(sessionId, plainText, preKey));
    }
  }

  const payloads: SessionPayloadBundle[] = await Promise.all(encryptions);

  if (payloads) {
    payloads.forEach((payload: SessionPayloadBundle) => {
      const {sessionId, encryptedPayload} = payload;
      const [userId, clientId] = sessionId.split('@');
      recipients[userId][clientId] = encryptedPayload;
    });
  }

  return recipients;
}

async function encryptPayloadForSession(
  sessionId: string,
  plainText: Uint8Array,
  base64EncodedPreKey: string
): Promise<SessionPayloadBundle> {
  const cryptobox = new Cryptobox(new MemoryEngine());

  logger.info(`Encrypting Payload for session ID "${sessionId}"`);
  let encryptedPayload;

  try {
    const decodedPreKeyBundle = Buffer.from(base64EncodedPreKey, 'base64');
    const payload = await cryptobox.encrypt(sessionId, plainText, decodedPreKeyBundle);
    encryptedPayload = new Uint8Array(payload);
  } catch (error) {
    logger.error(`Could not encrypt payload: ${error.message}`);
    encryptedPayload = new Uint8Array(Buffer.from('💣', 'utf-8'));
  }

  return {encryptedPayload, sessionId};
}
