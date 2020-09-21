import {OTRRecipients} from '@wireapp/api-client/dist/conversation';
import {UserPreKeyBundleMap} from '@wireapp/api-client/dist/user';
import {SessionPayloadBundle} from '@wireapp/core/dist/cryptography';
import {PreKey as SerializedPreKey} from '@wireapp/api-client/dist/auth/';
import {Cryptobox} from '@wireapp/cryptobox';
import {MemoryEngine} from '@wireapp/store-engine';

export async function encryptMessage(
  plainText: Uint8Array,
  preKeyBundles: UserPreKeyBundleMap
): Promise<OTRRecipients> {
  const recipients: OTRRecipients = {};
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
      const sessionId: string = payload.sessionId;
      const encrypted: string = payload.encryptedPayload;
      const [userId, clientId] = sessionId.split('@');
      recipients[userId][clientId] = encrypted;
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

  console.info(`Encrypting Payload for session ID "${sessionId}"`);
  let encryptedPayload;

  try {
    const decodedPreKeyBundle = Buffer.from(base64EncodedPreKey, 'base64');
    const payloadAsBuffer = Buffer.from(await cryptobox.encrypt(sessionId, plainText, decodedPreKeyBundle));
    encryptedPayload = payloadAsBuffer.toString('base64');
  } catch (error) {
    console.error(`Could not encrypt payload: ${error.message}`);
    encryptedPayload = '💣';
  }

  return {encryptedPayload, sessionId};
}
