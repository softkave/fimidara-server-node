import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {
  InMemoryPubSubClient,
  InMemoryPubSubContext,
} from '../InMemoryPubSubContext.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('InMemoryPubSubClient', () => {
  class TestInMemoryPubSubClient extends InMemoryPubSubClient {
    getListeners() {
      return this.listeners;
    }
  }

  test('subscribe', async () => {
    const client = new TestInMemoryPubSubClient();
    const fn = () => {};
    await client.subscribe('channel', fn);
    expect(client.getListeners().has('channel')).toBe(true);
    expect(client.getListeners().get('channel')?.has(fn)).toBe(true);
  });

  test('unsubscribe', async () => {
    const client = new TestInMemoryPubSubClient();
    const fn = () => {};
    await client.subscribe('channel', fn);
    await client.unsubscribe('channel', fn);
    expect(client.getListeners().has('channel')).toBe(true);
    expect(client.getListeners().get('channel')?.has(fn)).toBe(false);
  });

  test('unsubscribe without fn', async () => {
    const client = new TestInMemoryPubSubClient();
    const fn = () => {};
    await client.subscribe('channel', fn);
    await client.unsubscribe('channel');
    expect(client.getListeners().has('channel')).toBe(false);
  });

  test('unsubscribe without channel and fn', async () => {
    const client = new TestInMemoryPubSubClient();
    const fn = () => {};
    await client.subscribe('channel', fn);
    await client.unsubscribe();
    expect(client.getListeners().size).toBe(0);
  });

  test('publish', async () => {
    const client = new TestInMemoryPubSubClient();
    const fn = vi.fn();
    await client.subscribe('channel', fn);
    await client.publish('channel', 'message');
    expect(fn).toHaveBeenCalledWith('message', 'channel');
  });
});

describe('InMemoryPubSubContext', () => {
  test('publish', async () => {
    const context = new InMemoryPubSubContext();
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.publish('channel', 'message');
    expect(fn).toHaveBeenCalledWith('message', 'channel', {
      unsubscribe: expect.any(Function),
    });
  });

  test('publish json', async () => {
    const context = new InMemoryPubSubContext();
    const json = {key: 'value'};
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    await context.publish('channel', json);
    expect(fn).toHaveBeenCalledWith(json, 'channel', {
      unsubscribe: expect.any(Function),
    });
  });

  test('subscribe', async () => {
    const context = new InMemoryPubSubContext();
    const fn = vi.fn();
    const sub = await context.subscribe('channel', fn);
    await context.publish('channel', 'message');
    expect(fn).toHaveBeenCalledWith('message', 'channel', {
      unsubscribe: expect.any(Function),
    });
    fn.mockClear();

    sub.unsubscribe();
    await context.publish('channel', 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe', async () => {
    const context = new InMemoryPubSubContext();
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.unsubscribe('channel', fn);
    await context.publish('channel', 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe without fn', async () => {
    const context = new InMemoryPubSubContext();
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.unsubscribe('channel');
    await context.publish('channel', 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe without channel and fn', async () => {
    const context = new InMemoryPubSubContext();
    const fn = vi.fn();
    await context.subscribe('channel', fn);
    await context.unsubscribe();
    await context.publish('channel', 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe json listener', async () => {
    const context = new InMemoryPubSubContext();
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    await context.unsubscribe('channel', fn);
    await context.publish('channel', {key: 'value'});
    expect(fn).not.toHaveBeenCalled();
  });

  test('subscribeJson', async () => {
    const context = new InMemoryPubSubContext();
    const fn = vi.fn();
    const sub = await context.subscribeJson('channel', fn);
    await context.publish('channel', {key: 'value'});
    expect(fn).toHaveBeenCalledWith({key: 'value'}, 'channel', {
      unsubscribe: expect.any(Function),
    });
    fn.mockClear();

    sub.unsubscribe();
    await context.publish('channel', {key: 'value'});
    expect(fn).not.toHaveBeenCalled();
  });

  test('subscribeJson with invalid message', async () => {
    const context = new InMemoryPubSubContext();
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    context.publish('channel', 'hello, world');
    expect(fn).not.toHaveBeenCalled();
  });
});
