import {DisposableResource} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {completeTests} from '../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../endpoints/testHelpers/utils.js';
import {waitTimeout} from '../../utils/fns.js';
import {kAsyncLocalStorageUtils} from '../asyncLocalStorage.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('asyncLocalStorage', () => {
  test('run within a run', async () => {
    const outerStore = {outer: true};
    const innerStore = {inner: true};
    const outerValue = {outerValue: true};
    const innerValue = {innerValue: true};
    const key = 'key';

    kAsyncLocalStorageUtils.run(async () => {
      kAsyncLocalStorageUtils.set(key, outerValue);
      await kAsyncLocalStorageUtils.run(async () => {
        kAsyncLocalStorageUtils.set(key, innerValue);
        await waitTimeout(0);
        expect(kAsyncLocalStorageUtils.get(key)).toBe(innerValue);
        expect(kAsyncLocalStorageUtils.getStore()).toEqual({
          ...innerStore,
          [key]: innerValue,
        });
      }, innerStore);

      expect(kAsyncLocalStorageUtils.get(key)).toBe(outerValue);
      expect(kAsyncLocalStorageUtils.getStore()).toEqual({
        ...outerStore,
        [key]: outerValue,
      });
    }, outerStore);
  });

  test('run disposes disposables', async () => {
    const disposable: DisposableResource = {
      dispose: vi.fn(),
    };

    await kAsyncLocalStorageUtils.run(() => {
      kAsyncLocalStorageUtils.disposables().add(disposable);
      expect(kAsyncLocalStorageUtils.disposables().getList()).toContain(
        disposable
      );
    });

    expect(disposable.dispose).toHaveBeenCalled();
  });
});
