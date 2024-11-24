import assert from 'assert';
import {RedisClientType, createClient} from 'redis';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisCacheProvider} from '../RedisCacheProvider.js';

let redis: RedisClientType | undefined;
const database = 1;

beforeAll(async () => {
  await initTests();

  const cacheRedisURL = kUtilsInjectables.suppliedConfig().cacheRedisURL;
  assert.ok(cacheRedisURL);
  redis = await createClient({url: cacheRedisURL, database});
  await redis.connect();
});

afterEach(async () => {
  await redis?.select(database);
  await redis?.flushDb();
  await redis?.unsubscribe();
});

afterAll(async () => {
  await redis?.quit();
  await completeTests();
});

describe.skip('RedisCacheProvider', () => {
  test('get', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    const value = await cache.get('test');
    expect(value).toBeNull();

    await redis.set('test', 'value');
    const value2 = await cache.get('test');
    expect(value2).toBe('value');
  });

  test('getJson', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    const value = await cache.getJson<{test: string}>('test');
    expect(value).toBeNull();

    await redis.set('test', JSON.stringify({test: 'value'}));
    const value2 = await cache.getJson<{test: string}>('test');
    expect(value2).toEqual({test: 'value'});
  });

  test('set', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    await cache.set('test', 'value');
    const value = await redis.get('test');
    expect(value).toBe('value');
  });

  test('setJson', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    await cache.setJson('test', {test: 'value'});
    const value = await redis.get('test');
    expect(value).toBe('{"test":"value"}');
  });

  test('delete', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    await cache.delete('test');
    const value = await redis.get('test');
    expect(value).toBeNull();
  });

  test('getList', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    const value = await cache.getList(['test1', 'test2']);
    expect(value).toEqual([null, null]);

    await redis.mSet(['test1', 'value1', 'test2', 'value2']);
    const value2 = await cache.getList(['test1', 'test2']);
    expect(value2).toEqual(['value1', 'value2']);
  });

  test('getJsonList', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    const value = await cache.getJsonList<{test: string}>(['test1', 'test2']);
    expect(value).toEqual([null, null]);

    await redis.mSet([
      ['test1', JSON.stringify({test: 'value1'})],
      ['test2', JSON.stringify({test: 'value2'})],
    ]);
    const value2 = await cache.getJsonList<{test: string}>(['test1', 'test2']);
    expect(value2).toEqual([{test: 'value1'}, {test: 'value2'}]);
  });

  test('setList', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    await cache.setList([
      {key: 'test1', value: 'value1'},
      {key: 'test2', value: 'value2'},
    ]);
    const value = await redis.mGet(['test1', 'test2']);
    expect(value).toEqual(['value1', 'value2']);
  });

  test('setJsonList', async () => {
    assert.ok(redis);
    const cache = new RedisCacheProvider(redis);
    await cache.setJsonList([
      {key: 'test1', value: {test: 'value1'}},
      {key: 'test2', value: {test: 'value2'}},
    ]);
    const value = await redis.mGet(['test1', 'test2']);
    expect(value).toEqual(['{"test":"value1"}', '{"test":"value2"}']);
  });
});
