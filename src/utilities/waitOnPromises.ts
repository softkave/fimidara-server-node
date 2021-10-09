export interface IPromiseWithId<T = any> {
  promise: Promise<T>;
  id: string | number;
}

export interface ISettledPromise<Value = any, Reason = any> {
  resolved: boolean;
  rejected: boolean;
  id: string | number;
  value?: Value;
  reason?: Reason;
}

function wrapPromise<T = any>(p: IPromiseWithId<T>) {
  return new Promise<ISettledPromise<T>>(resolve => {
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

const waitOnPromises = <P extends IPromiseWithId[]>(
  promises: P
): Promise<
  ISettledPromise<
    ReturnType<P[number]['promise']['then']>,
    ReturnType<P[number]['promise']['catch']>
  >[]
> => {
  const mappedPromises = promises.map(wrapPromise);
  return Promise.all(mappedPromises);
};

export default waitOnPromises;
