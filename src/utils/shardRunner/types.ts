import {AnyFn} from 'softkave-js-utils';
import {IQueueMessage} from '../../contexts/queue/types.js';
import {Agent} from '../../definitions/system.js';

export const kShardRunnerOutputType = {
  error: 1,
  success: 2,
  ack: 3,
} as const;

export type IShardRunnerOutput<TItem> =
  | {
      id: string;
      type: typeof kShardRunnerOutputType.error;
      error: unknown;
    }
  | {
      id: string;
      type: typeof kShardRunnerOutputType.success;
      item: TItem;
    }
  | {
      id: string;
      type: typeof kShardRunnerOutputType.ack;
    };

export interface IShardRunnerEntry<TItem> {
  id: string;
  outputChannel: string;
  item: TItem;
  agent: Agent;
}

export interface IShardRunnerMessage extends IQueueMessage {
  msg: string;
}

export const kShardRunnerPubSubAlertMessage = '1' as const;

export type ShardRunnerProvidedHandlerResult<TItem> =
  | {
      type: typeof kShardRunnerOutputType.error;
      error: unknown;
    }
  | {
      type: typeof kShardRunnerOutputType.success;
      item: TItem;
    };

export type ShardRunnerProvidedHandlerResultMap<TItem> = Record<
  string,
  ShardRunnerProvidedHandlerResult<TItem>
>;

export type ShardRunnerProvidedMultiItemsHandler<TItem> = AnyFn<
  [params: {items: IShardRunnerEntry<TItem>[]}],
  Promise<ShardRunnerProvidedHandlerResultMap<TItem>>
>;

export type ShardRunnerProvidedSingleItemHandler<TItem> = AnyFn<
  [params: {item: IShardRunnerEntry<TItem>}],
  Promise<ShardRunnerProvidedHandlerResult<TItem>>
>;
