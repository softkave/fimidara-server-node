import {identity, keyBy} from 'lodash-es';
import {IQueueContext, IQueueMessage} from './types.js';

export class InMemoryQueueContext implements IQueueContext {
  protected queues = new Map<
    string,
    Array<{id: string; message: IQueueMessage}>
  >();

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
      return idMessages.map(m => m.id);
    } else {
      throw new Error(`Queue ${key} does not exist`);
    }
  };

  getMessages = async (key: string, count: number, remove: boolean = false) => {
    if (!(await this.queueExists(key))) {
      await this.createQueue(key);
    }

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

  waitOnStream = (
    key: string,
    fn: (hasData: boolean) => unknown,
    timeout = 500
  ) => {
    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }

    const messages = this.queues.get(key) || [];
    const hasData = messages.length > 0;

    if (timeout && !hasData) {
      setTimeout(() => {
        const messages = this.queues.get(key) || [];
        const hasData = messages.length > 0;
        fn(hasData);
      }, timeout);
    } else {
      fn(hasData);
    }
  };

  dispose = async () => {
    this.queues.clear();
  };
}
