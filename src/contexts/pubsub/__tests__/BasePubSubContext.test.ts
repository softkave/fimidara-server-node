import {AnyFn} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {
  BasePubSubContext,
  IBasePubSubContextClient,
} from '../BasePubSubContext.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

class MockedBasePubSubClient implements IBasePubSubContextClient {
  listeners = new Map<string, Set<AnyFn>>();

  subscribe = vi.fn().mockImplementation(async (channel: string, fn: AnyFn) => {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }

    this.listeners.get(channel)?.add(fn);
  });

  unsubscribe = vi
    .fn()
    .mockImplementation(async (channel?: string, fn?: AnyFn) => {
      if (channel) {
        if (fn) {
          this.listeners.get(channel)?.delete(fn);
        } else {
          this.listeners.delete(channel);
        }
      } else {
        this.listeners.clear();
      }
    });

  publish = vi
    .fn()
    .mockImplementation(async (channel: string, message: unknown) => {
      this.listeners.get(channel)?.forEach(fn => fn(message, channel));
    });
}

describe('BasePubSubContext', () => {
  test('publish', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    await context.publish('channel', 'message');
    expect(client.publish).toHaveBeenCalledWith('channel', 'message');
  });

  test('publish json', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const json = {key: 'value'};
    await context.publish('channel', json);
    expect(client.publish).toHaveBeenCalledWith(
      'channel',
      JSON.stringify(json)
    );
  });

  test('subscribe', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const fn = () => {};
    const sub = await context.subscribe('channel', fn);
    expect(client.subscribe).toHaveBeenCalledWith(
      'channel',
      expect.any(Function)
    );

    sub.unsubscribe();
    expect(client.unsubscribe).toHaveBeenCalledWith(
      'channel',
      expect.any(Function)
    );
  });

  test('unsubscribe', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const fn = () => {};
    await context.unsubscribe('channel', fn);
    expect(client.unsubscribe).toHaveBeenCalledWith('channel', fn);
  });

  test('unsubscribe without fn', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    await context.unsubscribe('channel');
    expect(client.unsubscribe).toHaveBeenCalledWith('channel', undefined);
  });

  test('unsubscribe without channel and fn', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    await context.unsubscribe();
    expect(client.unsubscribe).toHaveBeenCalledWith(undefined, undefined);
  });

  test('unsubscribe json listener', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    await context.unsubscribe('channel', fn);
    expect(client.unsubscribe).toHaveBeenCalled();
    await context.publish('channel', {key: 'value'});
    expect(fn).not.toHaveBeenCalled();
  });

  test('subscribeJson', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const fn = vi.fn();
    const sub = await context.subscribeJson('channel', fn);
    expect(client.subscribe).toHaveBeenCalled();

    sub.unsubscribe();
    expect(client.unsubscribe).toHaveBeenCalled();
  });

  test('subscribeJson with message', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    const message = {key: 'value'};
    const json = JSON.stringify(message);
    context.publish('channel', json);
    expect(fn).toHaveBeenCalledWith(message, 'channel', {
      unsubscribe: expect.any(Function),
    });
  });

  test('subscribeJson with invalid message', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    context.publish('channel', 'hello, world');
    expect(fn).not.toHaveBeenCalled();
  });
});
