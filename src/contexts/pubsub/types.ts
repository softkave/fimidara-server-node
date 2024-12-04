import {AnyFn, AnyObject, DisposableResource} from 'softkave-js-utils';

export interface IPubSubSubscription {
  unsubscribe: () => void;
}

export type QueueContextSubscribeFn = (
  message: string | Buffer,
  channel: string,
  subscription: IPubSubSubscription
) => void;

export type QueueContextSubscribeJsonFn = (
  message: AnyObject,
  channel: string,
  subscription: IPubSubSubscription
) => void;

export interface IPubSubContext extends DisposableResource {
  subscribe: (
    channel: string,
    fn: QueueContextSubscribeFn
  ) => Promise<IPubSubSubscription>;
  subscribeJson: (
    channel: string,
    fn: QueueContextSubscribeJsonFn
  ) => Promise<IPubSubSubscription>;
  unsubscribe: (
    /** unsubscribe from a specific channel */
    channel?: string,
    /** unsubscribe a specific listener from a specific channel */
    fn?: AnyFn
  ) => Promise<void>;
  publish: (
    channel: string,
    message: string | Buffer | AnyObject
  ) => Promise<void>;
}
