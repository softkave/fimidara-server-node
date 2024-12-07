import {waitTimeout} from 'softkave-js-utils';
import {describe, expect, test} from 'vitest';
import {MemoryCacheProvider} from '../MemoryCacheProvider.js';

describe('MemoryCacheProvider', () => {
  test('get', async () => {
    const cache = new MemoryCacheProvider();
    const value = await cache.get('test');
    expect(value).toBeNull();

    await cache.set('test', 'value');
    const value2 = await cache.get('test');
    expect(value2).toBe('value');
  });

  test('setJson', async () => {
    const cache = new MemoryCacheProvider();
    await cache.setJson('test', {test: 'value'});
    const value = await cache.getJson<{test: string}>('test');
    expect(value).toEqual({test: 'value'});
  });

  test('setJson with ttl', async () => {
    const cache = new MemoryCacheProvider();
    const key = 'test' + Math.random();
    await cache.setJson(key, {test: 'value'}, {ttlMs: 100});
    const value = await cache.getJson<{test: string}>(key);
    expect(value).toEqual({test: 'value'});

    await waitTimeout(100);
    const value2 = await cache.getJson<{test: string}>(key);
    expect(value2).toBeFalsy();
  });

  test('setJsonList', async () => {
    const cache = new MemoryCacheProvider();
    await cache.setJsonList([
      {key: 'test1', value: {test: 'value1'}},
      {key: 'test2', value: {test: 'value2'}},
    ]);
    const value = await cache.getJsonList<{test: string}>(['test1', 'test2']);
    expect(value).toEqual([{test: 'value1'}, {test: 'value2'}]);
  });

  test('delete', async () => {
    const cache = new MemoryCacheProvider();
    await cache.set('test1', 'value1');
    await cache.delete('test1');
    const value = await cache.get('test1');
    expect(value).toBeNull();
  });

  test('getJson', async () => {
    const cache = new MemoryCacheProvider();
    const value = await cache.getJson<{test: string}>('test');
    expect(value).toBeNull();

    await cache.setJson('test', {test: 'value'});
    const value2 = await cache.getJson<{test: string}>('test');
    expect(value2).toEqual({test: 'value'});
  });

  test('getJsonList', async () => {
    const cache = new MemoryCacheProvider();
    const value = await cache.getJsonList<{test: string}>(['test1', 'test2']);
    expect(value).toEqual([null, null]);

    await cache.setJsonList([
      {key: 'test1', value: {test: 'value1'}},
      {key: 'test2', value: {test: 'value2'}},
    ]);
    const value2 = await cache.getJsonList<{test: string}>(['test1', 'test2']);
    expect(value2).toEqual([{test: 'value1'}, {test: 'value2'}]);
  });

  test('getList', async () => {
    const cache = new MemoryCacheProvider();
    const value = await cache.getList(['test1', 'test2']);
    expect(value).toEqual([null, null]);

    await cache.setList([
      {key: 'test1', value: 'value1'},
      {key: 'test2', value: 'value2'},
    ]);
    const value2 = await cache.getList(['test1', 'test2']);
    expect(value2).toEqual(['value1', 'value2']);
  });

  test('set', async () => {
    const cache = new MemoryCacheProvider();
    await cache.set('test', 'value');
    const value = await cache.get('test');
    expect(value).toBe('value');
  });

  test('set with ttl', async () => {
    const cache = new MemoryCacheProvider();
    const key = 'test' + Math.random();
    await cache.set(key, 'value', {ttlMs: 100});
    const value = await cache.get(key);
    expect(value).toBe('value');

    await waitTimeout(100);
    const value2 = await cache.get(key);
    expect(value2).toBeFalsy();
  });

  test('setList', async () => {
    const cache = new MemoryCacheProvider();
    await cache.setList([
      {key: 'test1', value: 'value1'},
      {key: 'test2', value: 'value2'},
    ]);
    const value = await cache.getList(['test1', 'test2']);
    expect(value).toEqual(['value1', 'value2']);
  });
});
