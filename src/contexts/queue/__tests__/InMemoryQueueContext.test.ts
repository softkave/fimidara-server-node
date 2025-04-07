import {waitTimeout} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {InMemoryQueueContext} from '../InMemoryQueueContext.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('InMemoryQueueContext', () => {
  class TestInMemoryQueueContext extends InMemoryQueueContext {
    getQueues() {
      return this.queues;
    }
  }

  test('createQueue', async () => {
    const context = new TestInMemoryQueueContext();
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    expect(context.getQueues().has('queue')).toBe(true);
  });

  test('deleteQueue', async () => {
    const context = new TestInMemoryQueueContext();
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    await context.deleteQueue('queue');
    expect(context.getQueues().has('queue')).toBe(false);
  });

  test('queueExists', async () => {
    const context = new TestInMemoryQueueContext();
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    expect(await context.queueExists('queue')).toBe(true);
  });

  test("queueExists doesn't exist", async () => {
    const context = new TestInMemoryQueueContext();
    expect(await context.queueExists('queue')).toBe(false);
  });

  test('addMessages', async () => {
    const context = new TestInMemoryQueueContext();
    const idList = await context.addMessages('queue', [
      {id: '1', message: 'message'},
    ]);
    expect(context.getQueues().get('queue')).toEqual([
      {id: idList[0], message: {id: '1', message: 'message'}},
    ]);
  });

  test('getMessages', async () => {
    const context = new TestInMemoryQueueContext();
    const idList = await context.addMessages('queue', [
      {id: '1', message: 'message'},
    ]);
    const messages = await context.getMessages('queue', 1);
    expect(messages).toEqual([
      {
        id: idList[0],
        message: {id: '1', message: 'message'},
      },
    ]);
  });

  test('getMessages remove', async () => {
    const context = new TestInMemoryQueueContext();
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    await context.getMessages('queue', 1, true);
    expect(context.getQueues().get('queue')).toEqual([]);
  });

  test('deleteMessages', async () => {
    const context = new TestInMemoryQueueContext();
    const idList = await context.addMessages('queue', [
      {id: '1', message: 'message'},
    ]);
    await context.deleteMessages('queue', idList);
    expect(context.getQueues().get('queue')).toEqual([]);
  });

  test('waitOnStream with timeout', async () => {
    const context = new TestInMemoryQueueContext();
    const queue = 'queue';
    const fn = vi.fn();
    context.waitOnStream(queue, fn, /** timeout */ 1_000);
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    await waitTimeout(1_000);
    expect(fn).toHaveBeenCalledWith(true);
  });

  test('waitOnStream with data', async () => {
    const context = new TestInMemoryQueueContext();
    const queue = 'queue';
    const fn = vi.fn();
    await context.addMessages(queue, [{id: '1', message: 'message'}]);
    context.waitOnStream(queue, fn, /** timeout */ 1_000);
    expect(fn).toHaveBeenCalledWith(true);
  });

  test('waitOnStream without data', async () => {
    const context = new TestInMemoryQueueContext();
    const queue = 'queue';
    const fn = vi.fn();
    context.waitOnStream(queue, fn, /** timeout */ 0);
    expect(fn).toHaveBeenCalledWith(false);
  });
});
