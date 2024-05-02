import {noop} from 'lodash';
import {DisposableResource} from '../../../utils/disposables.js';
import {waitTimeout} from '../../../utils/fns.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {initTests} from '../../testUtils/testUtils.js';
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

  test('run disposes disposables only for real stores', async () => {
    const disposable: DisposableResource = {
      dispose: jest.fn(),
    };

    await kAsyncLocalStorageUtils.run(() => {
      kAsyncLocalStorageUtils.disposables().add(disposable);
      kAsyncLocalStorageUtils.shadowSet('key', 'value', noop);
      expect(kAsyncLocalStorageUtils.disposables().getList()).toContain(disposable);
    });

    expect(disposable.dispose).toHaveBeenCalled();
  });

  test('shadowSet', async () => {
    const shadowKey = 'shadowKey';
    const regularKey = 'regularKey';
    const shadowValueDepth01 = 'shadowValueDepth01';
    const shadowValueDepth02 = 'shadowValueDepth02';
    const regularValueDepth00 = 'regularValueDepth00';
    const regularValueDepth02 = 'regularValueDepth02';

    await kAsyncLocalStorageUtils.run(async () => {
      kAsyncLocalStorageUtils.set(regularKey, regularValueDepth00);

      await kAsyncLocalStorageUtils.shadowSet(shadowKey, shadowValueDepth01, async () => {
        expect(kAsyncLocalStorageUtils.get(shadowKey)).toBe(shadowValueDepth01);
        expect(kAsyncLocalStorageUtils.get(regularKey)).toBe(regularValueDepth00);

        await kAsyncLocalStorageUtils.shadowSet(
          shadowKey,
          shadowValueDepth02,
          async () => {
            expect(kAsyncLocalStorageUtils.get(shadowKey)).toBe(shadowValueDepth02);
            expect(kAsyncLocalStorageUtils.get(regularKey)).toBe(regularValueDepth00);
            kAsyncLocalStorageUtils.set(regularKey, regularValueDepth02);
          }
        );

        expect(kAsyncLocalStorageUtils.get(regularKey)).toBe(regularValueDepth02);
        kAsyncLocalStorageUtils.delete(regularKey);
      });

      expect(kAsyncLocalStorageUtils.get(shadowKey)).toBe(shadowValueDepth01);
      expect(kAsyncLocalStorageUtils.get(regularKey)).toBe(undefined);
    });
  });
});
