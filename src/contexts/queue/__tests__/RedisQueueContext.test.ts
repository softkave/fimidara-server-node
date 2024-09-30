import assert from 'assert';
import {RedisClientType, createClient} from 'redis';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {initFimidara} from '../../../endpoints/runtime/initFimidara.js';
import {globalDispose, globalSetup} from '../../globalUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisQueueContext} from '../RedisQueueContext.js';

let redis: RedisClientType | undefined;

beforeAll(async () => {
  await globalSetup({useFimidaraApp: false, useFimidaraWorkerPool: false});
  await initFimidara();

  const queueRedisURL = kUtilsInjectables.suppliedConfig().queueRedisURL;
  assert.ok(queueRedisURL);
  redis = await createClient({url: queueRedisURL});
  await redis.connect();
});

afterAll(async () => {
  await redis?.quit();
  await globalDispose();
});

describe('RedisQueueContext', () => {
  test('createQueue', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    await context.createQueue('queue');
    expect(await redis.exists('queue')).toBe(1);
  });

  test('deleteQueue', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    await context.createQueue('queue');
    await context.deleteQueue('queue');
    expect(await redis.exists('queue')).toBe(0);
  });

  test('queueExists', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    await context.createQueue('queue');
    expect(await context.queueExists('queue')).toBe(true);
  });

  test("queueExists doesn't exist", async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    expect(await context.queueExists('queue')).toBe(false);
  });

  test('addMessages', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    await context.createQueue('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    const messages = await redis.json.get('queue', {path: '.'});
    expect(messages).toEqual([{id: '1', message: 'message'}]);
  });

  test('getMessages', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    await context.createQueue('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    const messages = await context.getMessages('queue', 1);
    expect(messages).toEqual([{id: '1', message: 'message'}]);
  });

  test('getMessages remove', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    await context.createQueue('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    await context.getMessages('queue', 1, true);
    const messages = await redis.json.get('queue', {path: '.'});
    expect(messages).toEqual([]);
  });

  test('deleteMessages', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    await context.createQueue('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    await context.deleteMessages('queue', ['1']);
    const messages = await redis.json.get('queue', {path: '.'});
    expect(messages).toEqual([]);
  });

  test('waitOnStream', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    await context.createQueue('queue');
    const promise = context.waitOnStream('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    const message = await promise;
    expect(message).toEqual({id: '1', message: 'message'});
  });
});
