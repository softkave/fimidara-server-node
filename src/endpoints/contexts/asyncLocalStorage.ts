import {AsyncLocalStorage} from 'async_hooks';
import {get, isUndefined, set} from 'lodash';
import {toArray} from '../../utils/fns';
import {AnyFn, DisposableResource} from '../../utils/types';

export type FimidaraAsyncLocalStorageStore = Record<string, unknown>;
export type FimidaraAsyncLocalStorage = AsyncLocalStorage<FimidaraAsyncLocalStorageStore>;

export interface AsyncLocalStorageUtils {
  asyncLocalStorage: FimidaraAsyncLocalStorage;
  run: (cb: AnyFn) => void;
  get: <T = unknown>(key: string) => T | undefined;
  set: <T = unknown>(key: string, value: T) => T;
  defaultTo: <T = unknown>(
    key: string,
    defaultValue: T,
    /** set to `defaultValue` if `true` and value is `undefined` */
    set?: boolean
  ) => T;
  addDisposable: (disposable: DisposableResource | DisposableResource[]) => void;
  getDisposables: () => DisposableResource[];
}

const asyncLocalStorage = new AsyncLocalStorage<FimidaraAsyncLocalStorageStore>();

const getFn = <T = unknown>(key: string) => {
  return get(asyncLocalStorage.getStore() ?? {}, key) as T | undefined;
};

const setFn = <T = unknown>(key: string, value: T) => {
  return set(asyncLocalStorage.getStore() ?? {}, key, value) as T;
};

export const kAsyncLocalStorageUtils: AsyncLocalStorageUtils = {
  asyncLocalStorage,

  run: (cb: AnyFn) => {
    asyncLocalStorage.run({}, () => {
      cb();
    });
  },

  get: getFn,
  set: setFn,

  defaultTo: <T = unknown>(key: string, defaultValue: T, set?: boolean) => {
    const value = getFn<T>(key);

    if (isUndefined(value)) {
      if (set) {
        setFn(key, defaultValue);
      }

      return defaultValue;
    }

    return value;
  },

  addDisposable(disposable) {
    const existingDisposables = this.defaultTo<DisposableResource[]>(
      kAsyncLocalStorageKeys.dispose,
      []
    );
    this.set(
      kAsyncLocalStorageKeys.dispose,
      existingDisposables.concat(toArray(disposable))
    );
  },

  getDisposables() {
    return this.defaultTo<DisposableResource[]>(kAsyncLocalStorageKeys.dispose, []);
  },
};

export const kAsyncLocalStorageKeys = {
  dispose: 'dispose',
  txn: 'txn',
};
