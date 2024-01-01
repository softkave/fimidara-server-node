import {AsyncLocalStorage} from 'async_hooks';
import {get, set} from 'lodash';
import {DisposablesStore} from '../../utils/disposables';
import {AnyFn} from '../../utils/types';

export type FimidaraAsyncLocalStorageStore = Record<string, unknown>;
export type FimidaraAsyncLocalStorage = AsyncLocalStorage<FimidaraAsyncLocalStorageStore>;

export interface AsyncLocalStorageUtils {
  asyncLocalStorage: FimidaraAsyncLocalStorage;
  run: <TFn extends AnyFn>(cb: TFn) => ReturnType<TFn>;
  get: <T = unknown>(key: string) => T | undefined;
  set: <T = unknown>(key: string, value: T) => T;
  disposables: () => DisposablesStore;
}

const asyncLocalStorage = new AsyncLocalStorage<FimidaraAsyncLocalStorageStore>();

const getFn = <T = unknown>(key: string) => {
  return get(asyncLocalStorage.getStore() ?? {}, key) as T | undefined;
};

const setFn = <T = unknown>(key: string, value: T) => {
  set(asyncLocalStorage.getStore() ?? {}, key, value);
  return value;
};

export const kAsyncLocalStorageUtils: AsyncLocalStorageUtils = {
  asyncLocalStorage,

  run: <TFn extends AnyFn>(cb: TFn) => {
    return asyncLocalStorage.run(/** init store */ {}, () => {
      try {
        return cb();
      } finally {
        kAsyncLocalStorageUtils.disposables().disposeAll();
      }
    });
  },

  get: getFn,
  set: setFn,

  disposables() {
    return (
      this.get(kAsyncLocalStorageKeys.disposables) ||
      this.set(kAsyncLocalStorageKeys.disposables, new DisposablesStore())
    );
  },
};

export const kAsyncLocalStorageKeys = {
  txn: 'txn',
  disposables: 'disposables',
};
