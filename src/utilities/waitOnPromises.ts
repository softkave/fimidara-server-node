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
  promises: IPromiseWithId<T>[]
): Promise<ISettledPromiseWithId<T, any>[]> => {
  const mappedPromises = promises.map(wrapPromiseWithId);
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
