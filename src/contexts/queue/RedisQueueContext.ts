import {first} from 'lodash-es';
import {RedisClientType} from 'redis';
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
      await this.redis.json.set(key, '.', []);
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
    await this.redis.json.arrAppend(key, '.', ...redisJson);
  };

  deleteMessages = async (key: string, idList: Array<string | number>) => {
    const path = `$.[?(@.id in ${JSON.stringify(idList)})]`;
    await this.redis.json.del(key, path);
  };

  getMessages = async <T extends IQueueMessage>(
    key: string,
    count: number,
    remove?: boolean
  ) => {
    const items = await this.redis.json.get(key, {
      path: `.[0:${count}] `,
    });

    // TODO: test if this works
    // const items02 = await this.redis.json.get(key, {path: `$.slice(${count})`});
    // console.log(items02);

    if (remove) {
      await this.redis.json.set(key, '.', `$.slice(${count})`);
    }

    return items as unknown as T[];
  };

  queueExists = async (key: string) => {
    const exists = await this.redis.exists(key);
    return exists === 1;
  };

  waitOnStream = async <T extends IQueueMessage>(key: string) => {
    const res = await this.redis.xRead({key, id: '0-0'}, {COUNT: 1});
    return first(res)?.messages?.[0]?.message as T | undefined;
  };

  dispose = async () => {
    await this.redis.quit();
  };
}
