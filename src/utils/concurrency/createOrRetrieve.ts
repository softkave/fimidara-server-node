import assert from 'assert';
import {TimeoutError} from 'softkave-js-utils';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {ResourceLockedError} from '../../endpoints/errors.js';

const kPubSubMessage = '1';

export async function createOrRetrieve<T>(params: {
  key: string;
  durationMs?: number;
  timeoutMs?: number;
  create: () => Promise<T>;
  retrieve: (id: string, attempt: number) => Promise<T | undefined>;
}) {
  const existing = await params.retrieve(params.key, /* attempt */ 1);
  if (existing) {
    return existing;
  }

  try {
    const durationMs = params.durationMs ?? 5 * 60 * 1000; // default to 5 minutes
    const created = await kUtilsInjectables
      .redlock()
      .using(params.key, durationMs, async () => {
        const created = await params.create();
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
      return new Promise<T>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout;
        const timeoutMs = params.timeoutMs ?? 5 * 60 * 1000; // default to 5 minutes

        kUtilsInjectables
          .pubsub()
          .subscribe(params.key, (message, _channel, subscription) => {
            clearTimeout(timeoutId);
            assert.ok(message === kPubSubMessage);
            subscription.unsubscribe();

            params.retrieve(params.key, /* attempt */ 2).then(retrieved => {
              assert.ok(retrieved !== undefined);
              resolve(retrieved);
            });
          })
          .then(sub => {
            timeoutId = setTimeout(() => {
              sub.unsubscribe();
              reject(new TimeoutError());
            }, timeoutMs);
          });
      });
    }

    throw error;
  }
}
