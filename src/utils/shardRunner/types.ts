import {IQueueMessage} from '../../contexts/queue/types.js';
import {Agent} from '../../definitions/system.js';

export const kShardRunnerOutputType = {
  error: 0,
  success: 1,
  ack: 2,
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
      items: TItem[];
    }
  | {
      id: string;
      type: typeof kShardRunnerOutputType.ack;
    };

export interface IShardRunnerEntry<TItem> {
  id: string;
  pubSubChannel: string;
  workspaceId: string;
  items: TItem[];
  agent: Agent;
}

export interface IShardRunnerMessage extends IQueueMessage {
  msg: string;
}

export const kShardRunnerPubSubAlertMessage = '1' as const;
