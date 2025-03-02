import assert from 'assert';
import Redis from 'ioredis';
import {RedisClientType, createClient} from 'redis';
import {kIkxUtils} from './ijx/injectables.js';

export async function getRedis() {
  const {redisDatabase, redisURL} = kIkxUtils.suppliedConfig();
  assert.ok(redisURL);

  const redis: RedisClientType = createClient({
    url: redisURL,
    database: redisDatabase,
  });

  await redis
    .on('error', err => kIkxUtils.logger().error('Redis error', err))
    .connect();

  return redis;
}

export async function getIoRedis() {
  const {redisDatabase, redisURL} = kIkxUtils.suppliedConfig();
  assert.ok(redisURL);

  const p = new URL(redisURL);
  const redis = new Redis.default({
    port: parseInt(p.port),
    host: p.hostname,
    username: p.username,
    password: p.password,
    db: redisDatabase,
    lazyConnect: true,
  });

  await redis
    .on('error', err => kIkxUtils.logger().error('Redis error', err))
    .connect();

  return redis;
}
