import {describe, expect, test, vi} from 'vitest';
import {
  BasePubSubContext,
  IBasePubSubContextClient,
} from '../BasePubSubContext.js';

class MockedBasePubSubClient implements IBasePubSubContextClient {
  subscribe = vi.fn();
  unsubscribe = vi.fn();
  publish = vi.fn();
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
    await context.subscribe('channel', fn);
    expect(client.subscribe).toHaveBeenCalledWith('channel', fn);
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
    expect(client.unsubscribe).toHaveBeenCalledWith('channel', vi.fn());
    await context.publish('channel', {key: 'value'});
    expect(fn).not.toHaveBeenCalled();
  });

  test('subscribeJson', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const fn = () => {};
    await context.subscribeJson('channel', fn);
    expect(client.subscribe).toHaveBeenCalledWith('channel', vi.fn());
  });

  test('subscribeJson with message', async () => {
    const client = new MockedBasePubSubClient();
    const context = new BasePubSubContext(client);
    const fn = vi.fn();
    await context.subscribeJson('channel', fn);
    const message = {key: 'value'};
    const json = JSON.stringify(message);
    context.publish('channel', json);
    expect(fn).toHaveBeenCalledWith(message, 'channel');
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
