import {DisposableResource} from 'softkave-js-utils';

export interface IQueueMessage {
  id: string | number;
}

export interface IQueueContext extends DisposableResource {
  createQueue: (key: string) => Promise<void>;
  deleteQueue: (key: string) => Promise<void>;
  queueExists: (key: string) => Promise<boolean>;
  addMessages: <T extends IQueueMessage>(
    key: string,
    messages: Array<T>
  ) => Promise<void>;
  getMessages: <T extends IQueueMessage = IQueueMessage>(
    key: string,
    count: number,
    remove?: boolean
  ) => Promise<Array<T>>;
  deleteMessages: (
    key: string,
    idList: Array<string | number>
  ) => Promise<void>;
  waitOnStream: <T extends IQueueMessage = IQueueMessage>(
    key: string
  ) => Promise<T | undefined>;
}
