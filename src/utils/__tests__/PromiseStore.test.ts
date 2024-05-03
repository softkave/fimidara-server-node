import assert from 'assert';
import {expectErrorThrown} from '../../endpoints/testUtils/helpers/error.js';
import {completeTests} from '../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../endpoints/testUtils/testUtils.js';
import {PromiseStore} from '../PromiseStore.js';
import {waitTimeout} from '../fns.js';
import {getDeferredPromise} from '../promiseFns.js';
import {test, beforeAll, afterAll, describe, expect, vi} from 'vitest';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('PromiseStore', () => {
  test('forget', async () => {
    try {
      const store = new TestPromiseStore();

      store.forget(
        (async (): Promise<void> => {
          waitTimeout(1_000);
          return Promise.reject();
        })()
      );

      await waitTimeout(1);
      await store.flush();
    } catch (error) {
      assert.fail('error not caught');
    }
  });

  test('flush', async () => {
    const store = new TestPromiseStore();
    const dPromise01 = getDeferredPromise();
    const dPromise02 = getDeferredPromise();
    const dPromise03 = getDeferredPromise();
    const thenFn = vi.fn();
    dPromise01.promise.then(thenFn);
    dPromise02.promise.then(thenFn);
    dPromise03.promise.then(thenFn);

    store.forget(dPromise01.promise);
    store.forget(dPromise02.promise);
    store.forget(dPromise03.promise);
    const pFlush = store.flush();
    dPromise01.resolve();
    dPromise02.resolve();
    dPromise03.resolve();
    await pFlush;

    expect(thenFn).toHaveBeenCalledTimes(3);
    await waitTimeout(0);
    store.expectIsEmpty();
  });

  test('close', () => {
    const store = new TestPromiseStore();

    store.close();

    expectErrorThrown(() => store.forget(Promise.resolve()));
  });
});

class TestPromiseStore extends PromiseStore {
  expectIsEmpty() {
    expect(Object.values(this.promiseRecord).length).toBe(0);
  }
}
