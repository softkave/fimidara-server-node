import {isArray} from 'lodash-es';
import {kIjxUtils} from '../contexts/ijx/injectables.js';

export interface PromiseWithId<T = unknown> {
  promise: Promise<T>;
  id: string | number;
}

export type SettledPromise<Value = unknown, Reason = unknown> =
  | {resolved: true; value: Value}
  | {resolved: false; reason?: Reason};

export type SettledPromiseWithId<
  Value = unknown,
  Reason = unknown,
> = SettledPromise<Value, Reason> & {
  id: string | number;
};

export type InferPromiseWithIdData<T extends PromiseWithId> =
  T extends PromiseWithId<infer TData01> ? TData01 : unknown;

export type GetSettledPromise<
  T extends PromiseWithId,
  TData = InferPromiseWithIdData<T>,
> = SettledPromiseWithId<TData> &
  Pick<T, Exclude<keyof T, keyof SettledPromiseWithId>>;

function wrapPromiseWithId<T extends PromiseWithId>(p: T) {
  return new Promise<GetSettledPromise<T>>(resolve => {
    p.promise
      .then(result =>
        resolve({
          ...p,
          resolved: true,
          value: result as InferPromiseWithIdData<T>,
        })
      )
      .catch(error => resolve({...p, resolved: false, reason: error}));
  });
}

export const waitOnPromisesWithId = async <T extends PromiseWithId>(
  promises: T[] | Record<string, T>
) => {
  const mappedPromises: Array<Promise<GetSettledPromise<T>>> = [];
  const entries = isArray(promises)
    ? promises.entries()
    : Object.entries(promises);

  for (const [, promise] of entries) {
    mappedPromises.push(wrapPromiseWithId(promise));
  }

  return await Promise.all(mappedPromises);
};

function wrapPromise<T = unknown>(p: Promise<T>) {
  return new Promise<SettledPromise<T>>(resolve => {
    p.then(result => resolve({resolved: true, value: result})).catch(error =>
      resolve({resolved: false, reason: error})
    );
  });
}

export const waitOnPromises = <ProvidedPromise extends Promise<unknown>[]>(
  promises: ProvidedPromise
): Promise<
  SettledPromise<
    Parameters<NonNullable<Parameters<ProvidedPromise[number]['then']>[0]>>[0],
    Parameters<NonNullable<Parameters<ProvidedPromise[number]['catch']>[0]>>[0]
  >[]
> => {
  const mappedPromises = promises.map(wrapPromise);
  return Promise.all(mappedPromises);
};

export function logRejectedPromisesAndThrow(
  p: PromiseSettledResult<unknown>[]
) {
  const rejected: PromiseRejectedResult[] = p.filter(
    p => p.status === 'rejected'
  ) as unknown as PromiseRejectedResult[];

  if (rejected.length > 0) {
    rejected.forEach(p => {
      kIjxUtils.logger().error(p.reason);
    });
    throw new Error('One or more promises rejected');
  }
}
