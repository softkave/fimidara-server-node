import {flatten} from 'lodash-es';
import {RedisClientType} from 'redis';
import {AnyFn} from 'softkave-js-utils';
import {kIjxUtils} from '../ijx/injectables.js';
import {IQueueContext, IQueueMessage} from './types.js';
import {cleanQueueMessages} from './utils.js';

export class RedisQueueContext implements IQueueContext {
  constructor(protected redis: RedisClientType) {}

  deleteQueue = async (key: string) => {
    await this.redis.del(key);
  };

  addMessages = async (key: string, messages: Array<IQueueMessage>) => {
    const cleanMessages = cleanQueueMessages(messages);

    // TODO: look for a way to do this in bulk
    // TODO: inform users it's possible it's not added in order
    const ids = await Promise.all(
      cleanMessages.map(message => {
        return this.redis.xAdd(key, '*', message);
      })
    );

    return ids;
  };

  deleteMessages = async (key: string, idList: Array<string>) => {
    await this.redis.xDel(key, idList);
  };

  getMessages = async (key: string, count: number, remove?: boolean) => {
    const messages = await this.redis.xRead({key, id: '0'}, {COUNT: count});
    const messagesArray = flatten(messages?.map(m => m.messages) ?? []);
    const idList = messagesArray.map(m => m.id);

    if (remove && messagesArray.length > 0) {
      await this.deleteMessages(key, idList);

      // TODO: compare performance of this with the above
      // const messageLast = last(messagesArray);
      // const minIdStr = messageLast?.id;
      // assert.ok(minIdStr);
      // const minId = parseInt(minIdStr.split('-')[0], 10);
      // assert.ok(minId);
      // await this.redis.xTrim(key, 'MINID', minId);
    }

    return messagesArray as Array<{id: string; message: IQueueMessage}>;
  };

  queueExists = async (key: string) => {
    const exists = await this.redis.exists(key);
    return exists === 1;
  };

  waitOnStream = async (key: string, fn: AnyFn, timeout = 500) => {
    // TODO: rather than blocking, we should use a pubsub channel
    const p = this.redis.xRead({key, id: '0-0'}, {COUNT: 1, BLOCK: timeout});
    p.catch(reason => {
      fn(false);
      kIjxUtils.logger().error(reason);
    });
    p.then(data => {
      const hasData = data?.length && data[0]?.messages?.length;
      fn(hasData);
    });
  };
}
