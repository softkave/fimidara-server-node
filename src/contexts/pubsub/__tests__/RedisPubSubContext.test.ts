import assert from 'assert';
import {waitTimeout} from 'softkave-js-utils';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {kIjxUtils} from '../../ijx/injectables.js';
import {RedisPubSubContext} from '../RedisPubSubContext.js';

beforeAll(async () => {
  await initTests();
});

afterEach(async () => {
  const [redis, redis02] = kIjxUtils.redis();
  assert.ok(redis);
  assert.ok(redis02);
  await redis?.unsubscribe();
  await redis02?.unsubscribe();
});

afterAll(async () => {
  await completeTests();
});

describe('RedisPubSubContext', () => {
  test('subscribe + publish', async () => {
    const [redis, redis02] = kIjxUtils.redis();
    assert.ok(redis);
    assert.ok(redis02);
    const context01 = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    const sub = await context01.subscribe(channel, fn);
    await context01.publish(channel, 'message');

    // wait for the message to be received
    await waitTimeout(200);
    expect(fn).toHaveBeenCalledWith('message', channel, {
      unsubscribe: expect.any(Function),
    });
    fn.mockClear();

    sub.unsubscribe();
    await context01.publish(channel, 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('subscribe + publish json', async () => {
    const [redis, redis02] = kIjxUtils.redis();
    const context01 = new RedisPubSubContext(redis, redis02);
    const json = {key: 'value'};
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    const sub = await context01.subscribeJson(channel, fn);
    await context01.publish(channel, json);

    // wait for the message to be received
    await waitTimeout(100);
    expect(fn).toHaveBeenCalledWith(json, channel, {
      unsubscribe: expect.any(Function),
    });
    fn.mockClear();

    sub.unsubscribe();
    await context01.publish(channel, json);
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe', async () => {
    const [redis, redis02] = kIjxUtils.redis();
    const context = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context.subscribe(channel, fn);
    await context.unsubscribe(channel, fn);
    await context.publish(channel, 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe without fn', async () => {
    const [redis, redis02] = kIjxUtils.redis();
    const context = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context.subscribe(channel, fn);
    await context.unsubscribe(channel);
    await context.publish(channel, 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe without channel and fn', async () => {
    const [redis, redis02] = kIjxUtils.redis();
    const context = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context.subscribe(channel, fn);
    await context.unsubscribe();
    await context.publish(channel, 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe json listener', async () => {
    const [redis, redis02] = kIjxUtils.redis();
    const context = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context.subscribeJson(channel, fn);
    await context.unsubscribe(channel, fn);
    await context.publish(channel, {key: 'value'});
    expect(fn).not.toHaveBeenCalled();
  });

  test('subscribeJson with invalid message', async () => {
    const [redis, redis02] = kIjxUtils.redis();
    const context01 = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context01.subscribeJson(channel, fn);
    context01.publish(channel, 'hello, world');
    expect(fn).not.toHaveBeenCalled();
  });
});
