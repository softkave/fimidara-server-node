import {sortStringListLexicographically} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisDSetProvider} from '../RedisDSetProvider.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('RedisDSetProvider', () => {
  test('add', async () => {
    const [redis] = kUtilsInjectables.redis();
    const dset = new RedisDSetProvider(redis);
    const key = 'test' + Math.random();
    await dset.add(key, ['a', 'b', 'c']);
    expect(sortStringListLexicographically(await dset.getAll(key))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  test('delete', async () => {
    const [redis] = kUtilsInjectables.redis();
    const dset = new RedisDSetProvider(redis);
    const key = 'test' + Math.random();
    await dset.add(key, ['a', 'b', 'c']);
    await dset.delete(key, ['a', 'b']);
    expect(await dset.getAll(key)).toEqual(['c']);
  });

  test('has', async () => {
    const [redis] = kUtilsInjectables.redis();
    const dset = new RedisDSetProvider(redis);
    const key = 'test' + Math.random();
    await dset.add(key, ['a', 'b', 'c']);
    expect(await dset.has(key, 'a')).toBe(true);
    expect(await dset.has(key, 'd')).toBe(false);
  });

  test('size', async () => {
    const [redis] = kUtilsInjectables.redis();
    const dset = new RedisDSetProvider(redis);
    const key = 'test' + Math.random();
    await dset.add(key, ['a', 'b', 'c']);
    expect(await dset.size(key)).toBe(3);
  });

  test('scan', async () => {
    const [redis] = kUtilsInjectables.redis();
    const dset = new RedisDSetProvider(redis);
    const key = 'test' + Math.random();
    await dset.add(key, ['a', 'b', 'c']);
    const result = await dset.scan(key, {size: 3});
    expect({
      values: sortStringListLexicographically(result.values as string[]),
      cursor: result.cursor,
      done: result.done,
    }).toEqual({
      values: ['a', 'b', 'c'],
      cursor: 0,
      done: true,
    });
  });

  test('getAll', async () => {
    const [redis] = kUtilsInjectables.redis();
    const dset = new RedisDSetProvider(redis);
    const key = 'test' + Math.random();
    await dset.add(key, ['a', 'b', 'c']);
    expect(sortStringListLexicographically(await dset.getAll(key))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
