import {waitTimeout} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {kIjxUtils} from '../../ijx/injectables.js';
import {RedisCacheProvider} from '../RedisCacheProvider.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('RedisCacheProvider', () => {
  test('get', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const value = await cache.get('test');
    expect(value).toBeNull();

    const key = 'test' + Math.random();
    await redis.set(key, 'value');
    const value2 = await cache.get(key);
    expect(value2).toBe('value');
  });

  test('getJson', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const value = await cache.getJson<{test: string}>('test');
    expect(value).toBeNull();

    const key = 'test' + Math.random();
    await redis.set(key, JSON.stringify({test: 'value'}));
    const value2 = await cache.getJson<{test: string}>(key);
    expect(value2).toEqual({test: 'value'});
  });

  test('set', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const key = 'test' + Math.random();
    await cache.set(key, 'value');
    const value = await redis.get(key);
    expect(value).toBe('value');
  });

  test('set with ttl', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const key = 'test' + Math.random();
    await cache.set(key, 'value', {ttlMs: 100});
    const value = await cache.get(key);
    expect(value).toBe('value');

    await waitTimeout(100);
    const value2 = await cache.get(key);
    expect(value2).toBeFalsy();
  });

  test('setJson', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const key = 'test' + Math.random();
    await cache.setJson(key, {test: 'value'});
    const value = await redis.get(key);
    expect(value).toBe('{"test":"value"}');
  });

  test('setJson with ttl', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const key = 'test' + Math.random();
    await cache.setJson(key, {test: 'value'}, {ttlMs: 100});
    const value = await cache.getJson<{test: string}>(key);
    expect(value).toEqual({test: 'value'});

    await waitTimeout(100);
    const value2 = await cache.getJson<{test: string}>(key);
    expect(value2).toBeFalsy();
  });

  test('delete', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    await cache.delete('test');
    const key = 'test' + Math.random();
    const value = await redis.get(key);
    expect(value).toBeNull();
  });

  test('getList', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const value = await cache.getList(['test1', 'test2']);
    expect(value).toEqual([null, null]);

    const key1 = 'test1' + Math.random();
    const key2 = 'test2' + Math.random();
    await redis.mSet([
      [key1, 'value1'],
      [key2, 'value2'],
    ]);
    const value2 = await cache.getList([key1, key2]);
    expect(value2).toEqual(['value1', 'value2']);
  });

  test('getJsonList', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const value = await cache.getJsonList<{test: string}>(['test1', 'test2']);
    expect(value).toEqual([null, null]);

    const key1 = 'test1' + Math.random();
    const key2 = 'test2' + Math.random();
    await redis.mSet([
      [key1, JSON.stringify({test: 'value1'})],
      [key2, JSON.stringify({test: 'value2'})],
    ]);
    const value2 = await cache.getJsonList<{test: string}>([key1, key2]);
    expect(value2).toEqual([{test: 'value1'}, {test: 'value2'}]);
  });

  test('setList', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const key1 = 'test1' + Math.random();
    const key2 = 'test2' + Math.random();
    await cache.setList([
      {key: key1, value: 'value1'},
      {key: key2, value: 'value2'},
    ]);
    const value = await redis.mGet([key1, key2]);
    expect(value).toEqual(['value1', 'value2']);
  });

  test('setJsonList', async () => {
    const [redis] = kIjxUtils.redis();
    const cache = new RedisCacheProvider(redis);
    const key1 = 'test1' + Math.random();
    const key2 = 'test2' + Math.random();
    await cache.setJsonList([
      {key: key1, value: {test: 'value1'}},
      {key: key2, value: {test: 'value2'}},
    ]);
    const value = await redis.mGet([key1, key2]);
    expect(value).toEqual(['{"test":"value1"}', '{"test":"value2"}']);
  });
});
