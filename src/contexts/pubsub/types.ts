import {AnyObject, DisposableResource} from 'softkave-js-utils';

export type QueueContextSubscribeFn = (
  message: string | Buffer,
  channel: string
) => void;

export type QueueContextSubscribeJsonFn = (
  message: AnyObject,
  channel: string
) => void;

export interface IPubSubContext extends DisposableResource {
  subscribe: (channel: string, fn: QueueContextSubscribeFn) => Promise<void>;
  subscribeJson: (
    channel: string,
    fn: QueueContextSubscribeJsonFn
  ) => Promise<void>;
  unsubscribe: (
    /** unsubscribe from a specific channel */
    channel?: string,
    /** unsubscribe a specific listener from a specific channel */
    fn?: QueueContextSubscribeFn
  ) => Promise<void>;
  publish: (
    channel: string,
    message: string | Buffer | AnyObject
  ) => Promise<void>;
}
