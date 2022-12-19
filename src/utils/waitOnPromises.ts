import {Dictionary, map} from 'lodash';
import {IBaseContext} from '../endpoints/contexts/types';

export interface IPromiseWithId<T = any> {
  promise: Promise<T>;
  id: string | number;
}

export interface ISettledPromise<Value = any, Reason = any> {
  resolved: boolean;
  rejected: boolean;
  value?: Value;
  reason?: Reason;
}

export interface ISettledPromiseWithId<Value = any, Reason = any>
  extends ISettledPromise<Value, Reason> {
  id: string | number;
}

function wrapPromiseWithId<T = any>(p: IPromiseWithId<T>) {
  return new Promise<ISettledPromiseWithId<T>>(resolve => {
    p.promise
      .then(result =>
        resolve({
          ...p,
          resolved: true,
          rejected: false,
          value: result,
        })
      )
      .catch(error =>
        resolve({...p, resolved: false, rejected: true, reason: error})
      );
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
        rejected: false,
        value: result,
      })
    ).catch(error =>
      resolve({
        resolved: false,
        rejected: true,
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

export function logRejectedPromisesWithIdAndThrow(
  ctx: IBaseContext,
  p: ISettledPromiseWithId[]
) {
  const rejected = p.filter(p => p.rejected);
  if (rejected.length > 0) {
    rejected.forEach(p => {
      ctx.logger.error(`Promise ${p.id} rejected with reason ${p.reason}`);
    });
    throw new Error('One or more promises rejected');
  }
}

export function logRejectedPromisesAndThrow(
  ctx: IBaseContext,
  p: PromiseSettledResult<any>[]
) {
  const rejected: PromiseRejectedResult[] = p.filter(
    p => p.status === 'rejected'
  ) as unknown as PromiseRejectedResult[];

  if (rejected.length > 0) {
    rejected.forEach(p => {
      ctx.logger.error(p.reason);
    });
    throw new Error('One or more promises rejected');
  }
}
