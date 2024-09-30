import assert from 'assert';
import {createClient, RedisClientType} from 'redis';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {initFimidara} from '../../../endpoints/runtime/initFimidara.js';
import {globalDispose, globalSetup} from '../../globalUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisPubSubContext} from '../RedisPubSubContext.js';

let redis: RedisClientType | undefined;

beforeAll(async () => {
  await globalSetup({useFimidaraApp: false, useFimidaraWorkerPool: false});
  await initFimidara();

  const pubSubRedisURL = kUtilsInjectables.suppliedConfig().pubSubRedisURL;
  assert.ok(pubSubRedisURL);
  redis = await createClient({url: pubSubRedisURL});
  await redis.connect();
});

afterAll(async () => {
  await redis?.quit();
  await globalDispose();
});

describe.skip('RedisPubSubContext', () => {
  test('publish', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.publish('channel', 'message');
    expect(fn).toHaveBeenCalledWith('message', 'channel');
  });

  test('publish json', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const json = {key: 'value'};
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.publish('channel', json);
    expect(fn).toHaveBeenCalledWith(json, 'channel');
  });

  test('subscribe', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.publish('channel', 'message');
    expect(fn).toHaveBeenCalledWith('message', 'channel');
  });

  test('unsubscribe', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.unsubscribe('channel', fn);
    await context.publish('channel', 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe without fn', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.unsubscribe('channel');
    await context.publish('channel', 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe without channel and fn', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.unsubscribe();
    await context.publish('channel', 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe json listener', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    await context.unsubscribe('channel', fn);
    await context.publish('channel', {key: 'value'});
    expect(fn).not.toHaveBeenCalled();
  });

  test('subscribeJson', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    await context.publish('channel', {key: 'value'});
    expect(fn).toHaveBeenCalledWith({key: 'value'}, 'channel');
  });

  test('subscribeJson with invalid message', async () => {
    assert.ok(redis);
    const context = new RedisPubSubContext(redis);
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    context.publish('channel', 'hello, world');
    expect(fn).not.toHaveBeenCalled();
  });
});
