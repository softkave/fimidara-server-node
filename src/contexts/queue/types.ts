import {DisposableResource} from 'softkave-js-utils';

export type IQueueMessage = {
  [key: string]: string | undefined;
};

export type IQueueMessageInternal = {
  [key: string]: string;
};

export interface IQueueContext extends DisposableResource {
  deleteQueue: (key: string) => Promise<void>;
  queueExists: (key: string) => Promise<boolean>;
  addMessages: <T extends IQueueMessage>(
    key: string,
    messages: Array<T>
  ) => Promise<string[]>;
  getMessages: (
    key: string,
    count: number,
    remove?: boolean
  ) => Promise<Array<{id: string; message: IQueueMessage}>>;
  deleteMessages: (key: string, idList: Array<string>) => Promise<void>;
  waitOnStream: (
    key: string,
    fn: (hasData: boolean) => unknown,
    timeout?: number
  ) => void;
}
