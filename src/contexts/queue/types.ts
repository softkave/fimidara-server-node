import {AnyFn, DisposableResource} from 'softkave-js-utils';

export interface IQueueMessage {
  id: string;
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
  deleteMessages: (key: string, idList: Array<string>) => Promise<void>;
  waitOnStream: (key: string, fn: AnyFn) => void;
}
