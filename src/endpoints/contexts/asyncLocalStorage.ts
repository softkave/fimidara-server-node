import {AsyncLocalStorage} from 'async_hooks';
import {get, set} from 'lodash';
import {ReadonlyDeep} from 'type-fest';
import {DisposablesStore} from '../../utils/disposables.js';
import {mergeData} from '../../utils/fns.js';
import {AnyFn, AnyObject} from '../../utils/types.js';

export type FimidaraAsyncLocalStorageStore = Record<string, unknown>;
export type FimidaraAsyncLocalStorage = AsyncLocalStorage<FimidaraAsyncLocalStorageStore>;

export interface AsyncLocalStorageUtils {
  run: <TFn extends AnyFn>(cb: TFn, store?: AnyObject) => Promise<ReturnType<TFn>>;
  inheritAndRun: <TFn extends AnyFn>(
    cb: TFn,
    store?: AnyObject
  ) => Promise<ReturnType<TFn>>;
  get: <T = unknown>(key: string) => T | undefined;
  getStore: () => ReadonlyDeep<AnyObject>;
  set: <T = unknown>(key: string, value: T) => T;
  /** Set if `key` does not exist in store, or use `run()` inheriting parent
   * store to shadow set `key`. Shadow setting means shadow keys are stored in a
   * separate store so they don't collide, but other keys are store in the
   * closest real parent store. */
  shadowSet: <TFn extends AnyFn>(
    key: string,
    value: unknown,
    cb: TFn
  ) => Promise<ReturnType<TFn>>;
  /** Like `shadowSet` but creates a shadow store whether key exists or not. */
  shadowSetForce: <TFn extends AnyFn>(
    key: string,
    value: unknown,
    cb: TFn
  ) => Promise<ReturnType<TFn>>;
  delete: (key: string) => void;
  disposables: () => DisposablesStore;
}

const asyncLocalStorage = new AsyncLocalStorage<FimidaraAsyncLocalStorageStore>();

const kInternalKeys = {
  realStore: Symbol.for('realStore'),
};

function getAsyncLocalStore() {
  return asyncLocalStorage.getStore() ?? {};
}

function startShadowStore(realStore?: AnyObject) {
  const shadowStore: AnyObject = {};
  shadowStore[kInternalKeys.realStore] = realStore;
  return shadowStore;
}

/** Returns immedaite real store from shadow store. The real store returned may
 * itself be a shadow of another store. */
function getImmediateRealStore(
  shadowStore: AnyObject | undefined
): AnyObject | undefined {
  return shadowStore ? shadowStore[kInternalKeys.realStore] : undefined;
}

function shadowGet(store: AnyObject | undefined, key: string) {
  let item: unknown | undefined;

  for (; store && !item; store = getImmediateRealStore(store)) {
    item = get(store, key);
  }

  return item;
}

function getDeepestRealStore(store: AnyObject | undefined) {
  let realStore: AnyObject | undefined;

  for (; store; store = getImmediateRealStore(store)) {
    realStore = store;
  }

  return realStore;
}

function shadowSet(store: AnyObject | undefined, key: string, value: unknown) {
  const realStore = getDeepestRealStore(store);

  if (realStore) {
    set(realStore, key, value);
  }
}

function shadowDelete(store: AnyObject | undefined, key: string) {
  const realStore = getDeepestRealStore(store);

  if (realStore) {
    delete realStore[key];
  }
}

function isShadowStore(store: AnyObject) {
  return !!getImmediateRealStore(store);
}

export const kAsyncLocalStorageUtils: AsyncLocalStorageUtils = {
  run: <TFn extends AnyFn>(cb: TFn, store: AnyObject = {}) => {
    return asyncLocalStorage.run(store, async () => {
      try {
        return await cb();
      } finally {
        if (!isShadowStore(getAsyncLocalStore())) {
          kAsyncLocalStorageUtils.disposables().forgetDisposeAll();
        }
      }
    });
  },

  inheritAndRun: <TFn extends AnyFn>(cb: TFn, store: AnyObject = {}) => {
    return kAsyncLocalStorageUtils.run(
      cb,
      mergeData(store, getAsyncLocalStore(), {arrayUpdateStrategy: 'replace'})
    );
  },

  get: <T = unknown>(key: string) => {
    return shadowGet(asyncLocalStorage.getStore() ?? {}, key) as T | undefined;
  },

  set: <T = unknown>(key: string, value: T) => {
    shadowSet(asyncLocalStorage.getStore() ?? {}, key, value);
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
      this.set(kAsyncLocalStorageKeys.disposables, new DisposablesStore())
    );
  },

  getStore() {
    return asyncLocalStorage.getStore() ?? {};
  },

  shadowSet: <TFn extends AnyFn>(key: string, value: unknown, cb: TFn) => {
    if (kAsyncLocalStorageUtils.get(key)) {
      return kAsyncLocalStorageUtils.shadowSetForce(key, value, cb);
    } else {
      kAsyncLocalStorageUtils.set(key, value);
      return cb();
    }
  },

  shadowSetForce: async <TFn extends AnyFn>(key: string, value: unknown, cb: TFn) => {
    const shadowStore = startShadowStore(getAsyncLocalStore());
    set(shadowStore, key, value);
    return await kAsyncLocalStorageUtils.run(cb, shadowStore);
  },
};

export const kAsyncLocalStorageKeys = {
  txn: 'txn',
  disposables: 'disposables',
};
