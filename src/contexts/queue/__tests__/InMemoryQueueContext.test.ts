import {describe, expect, test} from 'vitest';
import {InMemoryQueueContext} from '../InMemoryQueueContext.js';

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
    const promise = context.waitOnStream('queue');
    await context.addMessages('queue', [{id: '1', message: 'message'}]);
    const message = await promise;
    expect(message).toEqual({id: '1', message: 'message'});
  });
});
