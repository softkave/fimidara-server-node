import {TimeoutError, waitTimeout} from 'softkave-js-utils';
import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {createOrRetrieve, kAckMessage} from '../createOrRetrieve.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('createOrRetrieve', () => {
  test('should create a new resource if it does not exist', async () => {
    const key = 'test' + Math.random();
    const result = await createOrRetrieve<string>({
      key,
      create: () => Promise.resolve('test01'),
      retrieve: () => Promise.resolve(undefined),
    });
    expect(result).toBe('test01');

    const ackKey = `ack-${key}`;
    const isAcked = await kIjxUtils.cache().get(ackKey);
    expect(isAcked).toBe(kAckMessage);
  });

  test('should retrieve an existing resource', async () => {
    const key = 'test' + Math.random();
    const result = await createOrRetrieve<string>({
      key,
      create: () => Promise.resolve('test01'),
      retrieve: () => Promise.resolve('test02'),
    });
    expect(result).toBe('test02');
  });

  test('should wait for the resource to be created', async () => {
    const key = 'test' + Math.random();
    let data: string | undefined;
    const pResult = createOrRetrieve<string>({
      key,
      create: async () => {
        await waitTimeout(1000);
        data = 'test01';
        return data;
      },
      retrieve: () => Promise.resolve(undefined),
    });
    await waitTimeout(50);
    const result02 = await createOrRetrieve<string>({
      key,
      create: () => {
        assert.fail('should not be called');
      },
      retrieve: () => Promise.resolve(data),
    });
    expect(data).toBe('test01');
    expect(result02).toBe(data);
    expect(await pResult).toBe(data);
  });

  test('should timeout if resource not created', async () => {
    const key = 'test' + Math.random();
    const pResult = createOrRetrieve<string>({
      key,
      create: async () => {
        await waitTimeout(2000);
        return 'test01';
      },
      retrieve: () => Promise.resolve(undefined),
    });
    await waitTimeout(50);

    try {
      await createOrRetrieve<string>({
        key,
        timeoutMs: 1000,
        create: () => {
          assert.fail('should not be called');
        },
        retrieve: () => Promise.resolve(undefined),
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TimeoutError);
    }

    expect(await pResult).toBe('test01');
  });

  test('increments attempt', async () => {
    const key = 'test' + Math.random();
    let registeredAttempt = 1;
    const result = await createOrRetrieve<string>({
      key,
      create: () => Promise.resolve('test01'),
      retrieve: (id, attempt) => {
        expect(attempt).toBe(registeredAttempt);
        registeredAttempt++;

        if (registeredAttempt === 2) {
          return Promise.resolve('test01');
        }

        return Promise.resolve(undefined);
      },
    });
    expect(result).toBe('test01');
  });
});
