import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
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
    await context.createQueue('queue');
    expect(context.getQueues().has('queue')).toBe(true);
  });

  test('deleteQueue', async () => {
    const context = new TestInMemoryQueueContext();
    await context.createQueue('queue');
    await context.deleteQueue('queue');
    expect(context.getQueues().has('queue')).toBe(false);
  });

  test('queueExists', async () => {
    const context = new TestInMemoryQueueContext();
    await context.createQueue('queue');
    expect(await context.queueExists('queue')).toBe(true);
  });

  test("queueExists doesn't exist", async () => {
    const context = new TestInMemoryQueueContext();
    expect(await context.queueExists('queue')).toBe(false);
  });

  test('addMessages', async () => {
    const context = new TestInMemoryQueueContext();
    await context.createQueue('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    expect(context.getQueues().get('queue')).toEqual([
      {id: '1', message: 'message'},
    ]);
  });

  test('getMessages', async () => {
    const context = new TestInMemoryQueueContext();
    await context.createQueue('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    const messages = await context.getMessages('queue', 1);
    expect(messages).toEqual([{id: '1', message: 'message'}]);
  });

  test('getMessages remove', async () => {
    const context = new TestInMemoryQueueContext();
    await context.createQueue('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    await context.getMessages('queue', 1, true);
    expect(context.getQueues().get('queue')).toEqual([]);
  });

  test('deleteMessages', async () => {
    const context = new TestInMemoryQueueContext();
    await context.createQueue('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    await context.deleteMessages('queue', ['1']);
    expect(context.getQueues().get('queue')).toEqual([]);
  });

  test('waitOnStream', async () => {
    const context = new TestInMemoryQueueContext();
    await context.createQueue('queue');
    const fn = vi.fn();
    context.waitOnStream('queue', fn);
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    expect(fn).toHaveBeenCalled();
  });
});
