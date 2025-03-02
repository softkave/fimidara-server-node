import assert from 'assert';
import {TimeoutError} from 'softkave-js-utils';
import {kIjxUtils} from '../../contexts/ijx/injectables.js';
import {ResourceLockedError} from '../../endpoints/errors.js';

export const kPubSubMessage = '1';
export const kAckMessage = '2';

async function checkForAck<T>(params: {
  key: string;
  retrieve: (id: string, attempt: number) => Promise<T | undefined>;
}) {
  const ackKey = `ack-${params.key}`;
  const isAcked = await kIjxUtils.cache().get(ackKey);
  if (isAcked) {
    const existing = await params.retrieve(params.key, /* attempt */ 3);
    assert.ok(existing !== undefined);
    return existing;
  }

  return undefined;
}

function waitUntilUnlocked<T>(params: {
  key: string;
  timeoutMs?: number;
  retrieve: (id: string, attempt: number) => Promise<T | undefined>;
  _debug?: unknown;
}) {
  return new Promise<T>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let isAcked: boolean | undefined;
    const timeoutMs = params.timeoutMs ?? 5 * 60 * 1000; // default to 5 minutes

    const pubsubKey = `pubsub-${params.key}`;
    kIjxUtils
      .pubsub()
      .subscribe(pubsubKey, async (message, _channel, subscription) => {
        if (isAcked) {
          return;
        }

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

        // check for ack, it's possible that the resource was created while we
        // were waiting
        checkForAck({
          key: params.key,
          retrieve: params.retrieve,
        })
          .then(retrieved => {
            if (retrieved) {
              isAcked = true;
              clearTimeout(timeoutId);
              sub.unsubscribe();
              assert.ok(retrieved !== undefined);
              resolve(retrieved);
            }
          })
          .catch(reject);
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
  _debug?: unknown;
}) {
  const existing = await params.retrieve(params.key, /* attempt */ 1);
  if (existing) {
    return existing;
  }

  const ackKey = `ack-${params.key}`;
  const isAcked = await kIjxUtils.cache().get(ackKey);
  if (isAcked) {
    const existing = await params.retrieve(params.key, /* attempt */ 3);
    assert.ok(existing !== undefined);
    return existing;
  }

  try {
    const durationMs = params.durationMs ?? 5 * 60 * 1000; // default to 5 minutes
    const holdMs = params.holdMs ?? 5 * 60 * 1000; // default to 5 minutes
    const created = await kIjxUtils.redlock().using(
      params.key,
      durationMs,
      async () => {
        const created = await params.create();
        await kIjxUtils.cache().set(ackKey, kAckMessage, {
          ttlMs: holdMs,
        });

        const pubsubKey = `pubsub-${params.key}`;
        kIjxUtils;
        kIjxUtils
          .promises()
          .callAndForget(() =>
            kIjxUtils.pubsub().publish(pubsubKey, kPubSubMessage)
          );

        return created;
      },
      {retryCount: 0}
    );

    return created;
  } catch (error) {
    if (error instanceof ResourceLockedError) {
      return waitUntilUnlocked({
        key: params.key,
        timeoutMs: params.timeoutMs,
        retrieve: params.retrieve,
        _debug: params._debug,
      });
    }

    throw error;
  }
}

export async function deleteAck(key: string) {
  await kIjxUtils.cache().delete(`ack-${key}`);
}
