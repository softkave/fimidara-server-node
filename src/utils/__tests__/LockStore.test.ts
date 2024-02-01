import {completeTests} from '../../endpoints/testUtils/helpers/test';
import {initTests} from '../../endpoints/testUtils/testUtils';
import {LockStore, LockableResource} from '../LockStore';
import {waitTimeout} from '../fns';
import {getNewId} from '../resource';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('LockStore', () => {
  test('run', async () => {
    const store = new TestLockStore();
    const lockName = 'lock';

    let fn01Done = false;
    let fn02Done = false;
    let fn03Done = false;

    const fn01 = jest.fn().mockImplementation(async () => {
      await waitTimeout(0);
      fn01Done = true;
    });
    const fn02 = jest.fn().mockImplementation(async () => {
      expect(fn01Done).toBeTruthy();
      await waitTimeout(0);
      fn02Done = true;
    });
    const fn03 = jest.fn().mockImplementation(async () => {
      expect(fn02Done).toBeTruthy();
      await waitTimeout(0);
      fn03Done = true;
    });

    const pLock01 = store.run(lockName, fn01);
    const pLock02 = store.run(lockName, fn02);
    const pLock03 = store.run(lockName, fn03);

    await Promise.all([pLock01, pLock02, pLock03]);
    expect(fn01Done).toBeTruthy();
    expect(fn02Done).toBeTruthy();
    expect(fn03Done).toBeTruthy();
    store.expectIsEmpty(lockName);
  });
});

describe('LockableResource', () => {
  test('run', async () => {
    const r00 = 'zero';
    const r01 = 'one';
    const r02 = 'two';
    const r03 = 'three';
    const lockName = getNewId();
    const rLock = new LockableResource<string>(r00, lockName);

    const fn01 = jest.fn().mockImplementation(async (data: string) => {
      expect(data).toBe(r00);
      await waitTimeout(0);
      return r01;
    });
    const fn02 = jest.fn().mockImplementation(async (data: string) => {
      expect(data).toBe(r01);
      await waitTimeout(0);
      return r02;
    });
    const fn03 = jest.fn().mockImplementation(async (data: string) => {
      expect(data).toBe(r02);
      await waitTimeout(0);
      return r03;
    });

    const pLock01 = rLock.run(fn01);
    const pLock02 = rLock.run(fn02);
    const pLock03 = rLock.run(fn03);

    await Promise.all([pLock01, pLock02, pLock03]);
  });
});

class TestLockStore extends LockStore {
  expectIsEmpty(name: string) {
    const queue = this.getLockQueue(name);
    expect(queue.length).toBe(0);
  }
}
