import assert from 'assert';
import Redis from 'ioredis';
import {RedisClientType, createClient} from 'redis';
import {kUtilsInjectables} from './injection/injectables.js';

export async function getRedis() {
  const {redisDatabase, redisURL} = kUtilsInjectables.suppliedConfig();
  assert.ok(redisURL);
  const redis: RedisClientType = createClient({
    url: redisURL,
    database: redisDatabase,
  });
  await redis.connect();
  return redis;
}

export async function getIoRedis() {
  const {redisDatabase, redisURL} = kUtilsInjectables.suppliedConfig();
  assert.ok(redisURL);
  const p = new URL(redisURL);
  const redis = new Redis.default({
    port: parseInt(p.port),
    host: p.hostname,
    db: redisDatabase,
    lazyConnect: true,
  });
  await redis.connect();
  return redis;
}
