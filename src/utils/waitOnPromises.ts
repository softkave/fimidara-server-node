import {Dictionary, map} from 'lodash';
import {getLogger} from '../endpoints/globalUtils';

export interface IPromiseWithId<T = any> {
  promise: Promise<T>;
  id: string | number;
}

export type ISettledPromise<Value = any, Reason = any> =
  | {
      resolved: true;
      value: Value;
    }
  | {
      resolved: false;
      reason?: Reason;
    };

export type ISettledPromiseWithId<Value = any, Reason = any> = ISettledPromise<Value, Reason> & {
  id: string | number;
};

function wrapPromiseWithId<T = any>(p: IPromiseWithId<T>) {
  return new Promise<ISettledPromiseWithId<T>>(resolve => {
    p.promise
      .then(result =>
        resolve({
          ...p,
          resolved: true,
          value: result,
        })
      )
      .catch(error => resolve({...p, resolved: false, reason: error}));
  });
}

export const waitOnPromisesWithId = <T>(
  promises: IPromiseWithId<T>[] | Dictionary<IPromiseWithId<T>>
): Promise<ISettledPromiseWithId<T, any>[]> => {
  const mappedPromises = map(promises, wrapPromiseWithId) as unknown as Promise<
    ISettledPromiseWithId<T, any>
  >[];
  return Promise.all(mappedPromises);
};

function wrapPromise<T = any>(p: Promise<T>) {
  return new Promise<ISettledPromise<T>>(resolve => {
    p.then(result =>
      resolve({
        resolved: true,
        value: result,
      })
    ).catch(error =>
      resolve({
        resolved: false,
        reason: error,
      })
    );
  });
}

export const waitOnPromises = <ProvidedPromise extends Promise<any>[]>(
  promises: ProvidedPromise
): Promise<
  ISettledPromise<
    Parameters<NonNullable<Parameters<ProvidedPromise[number]['then']>[0]>>[0],
    Parameters<NonNullable<Parameters<ProvidedPromise[number]['catch']>[0]>>[0]
  >[]
> => {
  const mappedPromises = promises.map(wrapPromise);
  return Promise.all(mappedPromises);
};

export function logRejectedPromisesAndThrow(p: PromiseSettledResult<any>[]) {
  const rejected: PromiseRejectedResult[] = p.filter(
    p => p.status === 'rejected'
  ) as unknown as PromiseRejectedResult[];

  if (rejected.length > 0) {
    rejected.forEach(p => {
      getLogger().error(p.reason);
    });
    throw new Error('One or more promises rejected');
  }
}
