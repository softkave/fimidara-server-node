import assert from 'assert';
import {RedisClientType, createClient} from 'redis';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisQueueContext} from '../RedisQueueContext.js';

let redis: RedisClientType | undefined;
const database = 3;

beforeAll(async () => {
  await initTests();

  const queueRedisURL = kUtilsInjectables.suppliedConfig().queueRedisURL;
  assert.ok(queueRedisURL);
  redis = await createClient({url: queueRedisURL, database});
  await redis.connect();
});

afterAll(async () => {
  await redis?.select(database);
  await redis?.flushDb();
  await redis?.quit();
  await completeTests();
});

describe.skip('RedisQueueContext', () => {
  test('createQueue', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    expect(await redis.exists(queue)).toBe(1);
  });

  test('deleteQueue', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    await context.deleteQueue(queue);
    expect(await redis.exists(queue)).toBe(0);
  });

  test('queueExists', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    expect(await context.queueExists(queue)).toBe(true);
  });

  test("queueExists doesn't exist", async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    expect(await context.queueExists(queue)).toBe(false);
  });

  test('addMessages', async () => {
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    const len = await redis.xLen(queue);
    expect(len).toBe(1);
  });

  test('getMessages', async () => {
    assert.ok(redis);
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
    assert.ok(redis);
    const context = new RedisQueueContext(redis);
    const queue = 'queue' + Math.random();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    await context.getMessages(queue, 1, true);
    const len = await redis.xLen(queue);
    expect(len).toBe(0);
  });

  test('deleteMessages', async () => {
    assert.ok(redis);
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
    assert.ok(redis);
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
