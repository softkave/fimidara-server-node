import assert from 'assert';
import {TimeoutError} from 'softkave-js-utils';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {ResourceLockedError} from '../../endpoints/errors.js';

export const kPubSubMessage = '1';
export const kAckMessage = '2';

async function waitUntilUnlocked<T>(params: {
  key: string;
  timeoutMs?: number;
  retrieve: (id: string, attempt: number) => Promise<T | undefined>;
}) {
  return new Promise<T>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    const timeoutMs = params.timeoutMs ?? 5 * 60 * 1000; // default to 5 minutes

    kUtilsInjectables
      .pubsub()
      .subscribe(params.key, (message, _channel, subscription) => {
        clearTimeout(timeoutId);
        assert.ok(message === kPubSubMessage);
        subscription.unsubscribe();

        params
          .retrieve(params.key, /* attempt */ 2)
          .then(retrieved => {
            assert.ok(retrieved !== undefined);
            resolve(retrieved);
          })
          .catch(reject);
      })
      .then(sub => {
        timeoutId = setTimeout(() => {
          sub.unsubscribe();
          reject(new TimeoutError());
        }, timeoutMs);
      })
      .catch(reject);
  });
}

export async function createOrRetrieve<T>(params: {
  key: string;
  durationMs?: number;
  timeoutMs?: number;
  holdMs?: number;
  create: () => Promise<T>;
  retrieve: (id: string, attempt: number) => Promise<T | undefined>;
}) {
  const existing = await params.retrieve(params.key, /* attempt */ 1);
  if (existing) {
    return existing;
  }

  const ackKey = `ack-${params.key}`;
  const isAcked = await kUtilsInjectables.cache().get(ackKey);
  if (isAcked) {
    const existing = await params.retrieve(params.key, /* attempt */ 3);
    assert.ok(existing !== undefined);
    return existing;
  }

  try {
    const durationMs = params.durationMs ?? 5 * 60 * 1000; // default to 5 minutes
    const holdMs = params.holdMs ?? 5 * 60 * 1000; // default to 5 minutes
    const created = await kUtilsInjectables
      .redlock()
      .using(params.key, durationMs, async () => {
        const created = await params.create();
        await kUtilsInjectables.cache().set(ackKey, kAckMessage, {
          ttlMs: holdMs,
        });
        kUtilsInjectables
          .promises()
          .forget(
            kUtilsInjectables.pubsub().publish(params.key, kPubSubMessage)
          );

        return created;
      });

    return created;
  } catch (error) {
    if (error instanceof ResourceLockedError) {
      return waitUntilUnlocked({
        key: params.key,
        timeoutMs: params.timeoutMs,
        retrieve: params.retrieve,
      });
    }

    throw error;
  }
}

export async function deleteAck(key: string) {
  await kUtilsInjectables.cache().delete(`ack-${key}`);
}
