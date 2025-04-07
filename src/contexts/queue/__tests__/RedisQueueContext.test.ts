import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {kIjxUtils} from '../../ijx/injectables.js';
import {RedisQueueContext} from '../RedisQueueContext.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('RedisQueueContext', () => {
  test('createQueue', async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    expect(await redis.exists(queue)).toBe(1);
  });

  test('deleteQueue', async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    await context.deleteQueue(queue);
    expect(await redis.exists(queue)).toBe(0);
  });

  test('queueExists', async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    expect(await context.queueExists(queue)).toBe(true);
  });

  test("queueExists doesn't exist", async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    expect(await context.queueExists(queue)).toBe(false);
  });

  test('addMessages', async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    const len = await redis.xLen(queue);
    expect(len).toBe(1);
  });

  test('getMessages', async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    const [id0] = await context.addMessages(queue, [
      {id: '1', message: 'message'},
    ]);
    const [id1] = await context.addMessages(queue, [
      {id: '2', message: 'message'},
    ]);
    const messages = await context.getMessages(queue, 2);
    expect(messages).toEqual([
      {id: id0, message: {id: '1', message: 'message'}},
      {id: id1, message: {id: '2', message: 'message'}},
    ]);
  });

  test('getMessages remove', async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    await context.getMessages(queue, 1, true);
    const len = await redis.xLen(queue);
    expect(len).toBe(0);
  });

  test('deleteMessages', async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    const idList = await context.addMessages(queue, [
      {id: '1', message: 'message'},
    ]);
    await context.deleteMessages(queue, idList);
    const len = await redis.xLen(queue);
    expect(len).toBe(0);
  });

  test('waitOnStream', async () => {
    const [redis] = kIjxUtils.redis();
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    const idList = await context.addMessages(queue, [
      {id: '1', message: 'message'},
    ]);
    await context.deleteMessages(queue, idList);
    const fn = vi.fn();
    context.waitOnStream(queue, fn);
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    expect(fn).toHaveBeenCalled();
  });
});
