import {RedisClientType} from 'redis';
import {AnyFn} from 'softkave-js-utils';
import {kUtilsInjectables} from '../injection/injectables.js';
import {IQueueContext, IQueueMessage} from './types.js';

type RedisJsonArrAppendParams = Parameters<
  RedisClientType['json']['arrAppend']
>;
type RedisJSON = RedisJsonArrAppendParams[2];

export class RedisQueueContext implements IQueueContext {
  constructor(protected redis: RedisClientType) {}

  createQueue = async (key: string) => {
    const exists = await this.queueExists(key);

    if (!exists) {
      await this.redis.json.set(key, '$', []);
    }
  };

  deleteQueue = async (key: string) => {
    await this.redis.del(key);
  };

  addMessages = async <T extends IQueueMessage>(
    key: string,
    messages: Array<T>
  ) => {
    const redisJson = messages as unknown as Array<RedisJSON>;
    await this.redis.json.arrAppend(key, '$', ...redisJson);
  };

  deleteMessages = async (key: string, idList: Array<string>) => {
    const path = `$.[?(${idList.map(id => `@.id == "${id}"`).join(' || ')})]`;
    await this.redis.json.del(key, path);
  };

  getMessages = async <T extends IQueueMessage>(
    key: string,
    count: number,
    remove?: boolean
  ) => {
    const items = await this.redis.json.get(key, {
      path: `$.[0:${count + 1}]`,
    });

    // TODO: test if this works
    // const items02 = await this.redis.json.get(key, {path: `$.slice(${count})`});
    // console.log(items02);

    if (remove) {
      await this.redis.json.arrTrim(key, '$', 1, count);
    }

    return items as unknown as T[];
  };

  queueExists = async (key: string) => {
    const exists = await this.redis.exists(key);
    return exists === 1;
  };

  waitOnStream = async (key: string, fn: AnyFn) => {
    const p = this.redis.xRead({key, id: '0-0'}, {COUNT: 1});
    p.catch(reason => kUtilsInjectables.logger().error(reason));
    p.finally(fn);
  };

  dispose = async () => {
    await this.redis.quit();
  };
}
