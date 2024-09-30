import {first, identity, keyBy} from 'lodash-es';
import {AnyFn} from 'softkave-js-utils';
import {IQueueContext, IQueueMessage} from './types.js';

export class InMemoryQueueContext implements IQueueContext {
  protected queues = new Map<string, Array<IQueueMessage>>();
  protected waitListeners = new Map<string, AnyFn[]>();

  createQueue = async (key: string) => {
    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }
  };

  deleteQueue = async (key: string) => {
    this.queues.delete(key);
  };

  queueExists = async (key: string) => {
    return this.queues.has(key);
  };

  addMessages = async <T extends IQueueMessage>(
    key: string,
    messages: Array<T>
  ) => {
    if (this.queues.has(key)) {
      this.queues.get(key)?.push(...messages);

      const message0 = first(messages);
      if (message0) {
        this.fanoutToWaitListeners(key, message0);
      }
    } else {
      throw new Error(`Queue ${key} does not exist`);
    }
  };

  getMessages = async <T extends IQueueMessage = IQueueMessage>(
    key: string,
    count: number,
    remove: boolean = false
  ) => {
    if (this.queues.has(key)) {
      const messages = this.queues.get(key) || [];

      if (remove) {
        return messages.splice(0, count) as T[];
      } else {
        return messages.slice(0, count) as T[];
      }
    } else {
      throw new Error(`Queue ${key} does not exist`);
    }
  };

  deleteMessages = async (key: string, idList: Array<string | number>) => {
    if (this.queues.has(key)) {
      const messages = this.queues.get(key) || [];
      const idMap = keyBy(idList, identity);
      this.queues.set(
        key,
        messages.filter(message => !idMap[message.id])
      );
    } else {
      throw new Error(`Queue ${key} does not exist`);
    }
  };

  waitOnStream = async <T extends IQueueMessage = IQueueMessage>(
    key: string
  ) => {
    if (this.queues.has(key)) {
      const messages = this.queues.get(key) || [];

      if (messages.length > 0) {
        return first(messages) as T;
      } else {
        return new Promise<T | undefined>(resolve => {
          if (this.waitListeners.has(key)) {
            this.waitListeners.get(key)?.push(resolve);
          } else {
            this.waitListeners.set(key, [resolve]);
          }
        });
      }
    } else {
      throw new Error(`Queue ${key} does not exist`);
    }
  };

  dispose = async () => {
    this.queues.clear();
    this.waitListeners.clear();
  };

  protected fanoutToWaitListeners(key: string, message: IQueueMessage) {
    const listeners = this.waitListeners.get(key);
    this.waitListeners.delete(key);
    listeners?.forEach(fn => fn(message));
  }
}
