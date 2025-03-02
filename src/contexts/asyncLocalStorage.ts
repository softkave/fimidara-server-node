import {AsyncLocalStorage} from 'async_hooks';
import {get, set} from 'lodash-es';
import {AnyFn, AnyObject, DisposablesStore} from 'softkave-js-utils';
import {ReadonlyDeep} from 'type-fest';
import {kIjxUtils} from './ijx/injectables.js';

export type FimidaraAsyncLocalStorageStore = Record<string, unknown>;
export type FimidaraAsyncLocalStorage =
  AsyncLocalStorage<FimidaraAsyncLocalStorageStore>;

export interface AsyncLocalStorageUtils {
  run: <TFn extends AnyFn>(
    cb: TFn,
    store?: AnyObject
  ) => Promise<ReturnType<TFn>>;
  get: <T = unknown>(key: string) => T | undefined;
  getStore: () => ReadonlyDeep<AnyObject>;
  set: <T = unknown>(key: string, value: T) => T;
  delete: (key: string) => void;
  disposables: () => DisposablesStore;
}

const asyncLocalStorage =
  new AsyncLocalStorage<FimidaraAsyncLocalStorageStore>();

function getKey(store: AnyObject | undefined, key: string) {
  const item: unknown | undefined = get(store, key);
  return item;
}

function setKey(store: AnyObject | undefined, key: string, value: unknown) {
  if (store) {
    set(store, key, value);
  }
}

function shadowDelete(store: AnyObject | undefined, key: string) {
  if (store) {
    delete store[key];
  }
}

export const kAsyncLocalStorageUtils: AsyncLocalStorageUtils = {
  run: <TFn extends AnyFn>(cb: TFn, store: AnyObject = {}) => {
    return asyncLocalStorage.run(store, async () => {
      try {
        return await cb();
      } finally {
        kAsyncLocalStorageUtils.disposables().forgetDisposeAll();
      }
    });
  },

  get: <T = unknown>(key: string) => {
    const store = asyncLocalStorage.getStore() ?? {};
    return getKey(store, key) as T | undefined;
  },

  set: <T = unknown>(key: string, value: T) => {
    setKey(asyncLocalStorage.getStore() ?? {}, key, value);
    return value;
  },

  delete: (key: string) => {
    // TODO: delete deep
    const store = asyncLocalStorage.getStore() ?? {};
    shadowDelete(store, key);
  },

  disposables() {
    return (
      this.get(kAsyncLocalStorageKeys.disposables) ||
      this.set(
        kAsyncLocalStorageKeys.disposables,
        new DisposablesStore(kIjxUtils.promises())
      )
    );
  },

  getStore() {
    return asyncLocalStorage.getStore() ?? {};
  },
};

export const kAsyncLocalStorageKeys = {
  txn: 'txn',
  disposables: 'disposables',
};
