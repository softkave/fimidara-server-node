import {IQueueMessage} from '../../contexts/queue/types.js';
import {Agent} from '../../definitions/system.js';

export const kShardRunnerQueueOutputType = {
  error: 0,
  success: 1,
  ack: 2,
} as const;

export type IShardRunnerQueueOutput<TItem> =
  | {
      id: string;
      type: typeof kShardRunnerQueueOutputType.error;
      error: unknown;
    }
  | {
      id: string;
      type: typeof kShardRunnerQueueOutputType.success;
      items: TItem[];
    }
  | {
      id: string;
      type: typeof kShardRunnerQueueOutputType.ack;
    };

export interface IShardRunnerQueueEntry<TItem> {
  id: string;
  pubSubChannel: string;
  workspaceId: string;
  items: TItem[];
  agent: Agent;
}

export interface IShardRunnerMessage extends IQueueMessage {
  msg: string;
}
