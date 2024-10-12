import {first, identity, keyBy} from 'lodash-es';
import {AnyFn} from 'softkave-js-utils';
import {IQueueContext, IQueueMessage} from './types.js';

export class InMemoryQueueContext implements IQueueContext {
  protected queues = new Map<
    string,
    Array<{id: string; message: IQueueMessage}>
  >();
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

  addMessages = async (key: string, messages: Array<IQueueMessage>) => {
    if (!(await this.queueExists(key))) {
      await this.createQueue(key);
    }

    if (this.queues.has(key)) {
      const now = Date.now();
      const idMessages = messages.map((message, index) => ({
        id: `${now}-${index}`,
        message,
      }));

      this.queues.get(key)?.push(...idMessages);
      const message0 = first(idMessages);

      if (message0) {
        this.fanoutToWaitListeners(key, message0);
      }

      return idMessages.map(m => m.id);
    } else {
      throw new Error(`Queue ${key} does not exist`);
    }
  };

  getMessages = async (key: string, count: number, remove: boolean = false) => {
    if (this.queues.has(key)) {
      const messages = this.queues.get(key) || [];

      if (remove) {
        return messages.splice(0, count) as Array<{
          id: string;
          message: IQueueMessage;
        }>;
      } else {
        return messages.slice(0, count) as Array<{
          id: string;
          message: IQueueMessage;
        }>;
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

  waitOnStream = async (key: string, fn: AnyFn) => {
    if (this.queues.has(key)) {
      const messages = this.queues.get(key) || [];

      if (messages.length > 0) {
        return fn();
      } else {
        if (this.waitListeners.has(key)) {
          this.waitListeners.get(key)?.push(fn);
        } else {
          this.waitListeners.set(key, [fn]);
        }
      }
    } else {
      throw new Error(`Queue ${key} does not exist`);
    }
  };

  dispose = async () => {
    this.queues.clear();
    this.waitListeners.clear();
  };

  protected fanoutToWaitListeners(
    key: string,
    message: {id: string; message: IQueueMessage}
  ) {
    const listeners = this.waitListeners.get(key);
    this.waitListeners.delete(key);
    listeners?.forEach(fn => fn(message));
  }
}
