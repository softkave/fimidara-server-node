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
          resolved: true,
          rejected: false,
          value: result,
          id: p.id,
        })
      )
      .catch(error =>
        resolve({
          resolved: false,
          rejected: true,
          reason: error,
          id: p.id,
        })
      );
  });
}

export const waitOnPromisesWithId = <ProvidedPromise extends IPromiseWithId[]>(
  promises: ProvidedPromise
): Promise<
  ISettledPromise<
    ReturnType<ProvidedPromise[number]['promise']['then']>,
    ReturnType<ProvidedPromise[number]['promise']['catch']>
  >[]
> => {
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
    ReturnType<ProvidedPromise[number]['then']>,
    ReturnType<ProvidedPromise[number]['catch']>
  >[]
> => {
  const mappedPromises = promises.map(wrapPromise);
  return Promise.all(mappedPromises);
};
