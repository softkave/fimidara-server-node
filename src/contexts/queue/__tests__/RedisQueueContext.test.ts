import assert from 'assert';
import {RedisClientType, createClient} from 'redis';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisQueueContext} from '../RedisQueueContext.js';

let redis: RedisClientType | undefined;
const queueNames: string[] = [];

beforeAll(async () => {
  await initTests();

  const queueRedisURL = kUtilsInjectables.suppliedConfig().queueRedisURL;
  assert.ok(queueRedisURL);
  redis = await createClient({url: queueRedisURL});
  await redis.connect();
});

afterAll(async () => {
  await Promise.all(queueNames.map(async queue => await redis?.del(queue)));

  await redis?.quit();
  await completeTests();
});

describe.skip('RedisQueueContext', () => {
  test('createQueue', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    await context.createQueue(queue);
    expect(await redis.exists(queue)).toBe(1);
  });

  test('deleteQueue', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    await context.createQueue(queue);
    await context.deleteQueue(queue);
    expect(await redis.exists(queue)).toBe(0);
  });

  test('queueExists', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    await context.createQueue(queue);
    expect(await context.queueExists(queue)).toBe(true);
  });

  test("queueExists doesn't exist", async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    expect(await context.queueExists(queue)).toBe(false);
  });

  test('addMessages', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    await context.createQueue(queue);
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    const messages = await redis.json.get(queue, {path: '.'});
    expect(messages).toEqual([{id: '1', message: 'message'}]);
  });

  test('getMessages', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    await context.createQueue(queue);
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    await context.addMessages(queue, [{id: '2', message: 'message'}]);
    const messages = await context.getMessages(queue, 1);
    expect(messages).toEqual([
      {id: '1', message: 'message'},
      {id: '2', message: 'message'},
    ]);
  });

  test('getMessages remove', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    await context.createQueue(queue);
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    await context.getMessages(queue, 1, true);
    const messages = await redis.json.get(queue, {path: '$.[0:2]'});
    expect(messages).toEqual([]);
  });

  test('deleteMessages', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    await context.createQueue(queue);
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    await context.deleteMessages(queue, ['1']);
    const messages = await redis.json.get(queue, {path: '$.[0:2]'});
    expect(messages).toEqual([]);
  });

  test('waitOnStream', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    queueNames.push(queue);
    await context.createQueue(queue);
    const fn = vi.fn();
    context.waitOnStream(queue, fn);
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    expect(fn).toHaveBeenCalled();
  });
});
