import assert from 'assert';
import {createClient, RedisClientType} from 'redis';
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
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisPubSubContext} from '../RedisPubSubContext.js';

let redis: RedisClientType | undefined;
let redis02: RedisClientType | undefined;
const database = 2;

beforeAll(async () => {
  await initTests();

  const pubSubRedisURL = kUtilsInjectables.suppliedConfig().pubSubRedisURL;
  assert.ok(pubSubRedisURL);
  redis = await createClient({url: pubSubRedisURL, database});
  redis02 = await createClient({url: pubSubRedisURL, database});
  await redis.connect();
  await redis02.connect();
});

afterEach(async () => {
  await redis?.unsubscribe();
  await redis02?.unsubscribe();
});

async function closeRedis(client: RedisClientType) {
  await client?.select(database);
  await client?.flushDb();
  await client?.quit();
}

afterAll(async () => {
  assert.ok(redis);
  assert.ok(redis02);
  await closeRedis(redis);
  await closeRedis(redis02);
  await completeTests();
});

describe.skip('RedisPubSubContext', () => {
  test('subscribe + publish', async () => {
    assert.ok(redis);
    assert.ok(redis02);
    const context01 = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context01.subscribe(channel, fn);
    await context01.publish(channel, 'message');
    expect(fn).toHaveBeenCalledWith('message', channel);
  });

  test('subscribe + publish json', async () => {
    assert.ok(redis);
    assert.ok(redis02);
    const context01 = new RedisPubSubContext(redis, redis02);
    const json = {key: 'value'};
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context01.subscribeJson(channel, fn);
    await context01.publish(channel, json);
    await waitTimeout(100);
    expect(fn).toHaveBeenCalledWith(json, channel);
  });

  test('unsubscribe', async () => {
    assert.ok(redis);
    assert.ok(redis02);
    const context = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context.subscribe(channel, fn);
    await context.unsubscribe(channel, fn);
    await context.publish(channel, 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe without fn', async () => {
    assert.ok(redis);
    assert.ok(redis02);
    const context = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context.subscribe(channel, fn);
    await context.unsubscribe(channel);
    await context.publish(channel, 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe without channel and fn', async () => {
    assert.ok(redis);
    assert.ok(redis02);
    const context = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context.subscribe(channel, fn);
    await context.unsubscribe();
    await context.publish(channel, 'message');
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribe json listener', async () => {
    assert.ok(redis);
    assert.ok(redis02);
    const context = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context.subscribeJson(channel, fn);
    await context.unsubscribe(channel, fn);
    await context.publish(channel, {key: 'value'});
    expect(fn).not.toHaveBeenCalled();
  });

  test('subscribeJson with invalid message', async () => {
    assert.ok(redis);
    assert.ok(redis02);
    assert.ok(redis02);
    const context01 = new RedisPubSubContext(redis, redis02);
    const fn = vi.fn();
    const channel = 'channel' + Math.random();
    await context01.subscribeJson(channel, fn);
    context01.publish(channel, 'hello, world');
    expect(fn).not.toHaveBeenCalled();
  });
});
