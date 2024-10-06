import {IQueueMessage} from '../../../contexts/queue/types.js';
import {Folder, PublicFolder} from '../../../definitions/folder.js';
import {Agent, SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {Shard, ShardRunner} from '../../../utils/shardedRunnerQueue.js';
import {Endpoint, EndpointResultNote} from '../../types.js';

export interface NewFolderInput {
  /** folder path should include the workspace rootname */
  folderpath: string;
  description?: string;
}

export interface AddFolderEndpointParams extends NewFolderInput {}

export interface AddFolderEndpointResult {
  folder: PublicFolder;
  notes?: EndpointResultNote[];
}

export type AddFolderEndpoint = Endpoint<
  AddFolderEndpointParams,
  AddFolderEndpointResult
>;

export interface AddFolderShardMeta {
  workspace: Workspace;
}

export interface AddFolderShardNewFolderInput extends NewFolderInput {
  agent: SessionAgent;
  UNSAFE_skipAuthCheck: boolean;
  throwOnFolderExists: boolean;
  isLeafFolder: boolean;
}

export type AddFolderShardPerInputOutputItem = Folder[];

export type AddFolderShard = Shard<
  AddFolderShardNewFolderInput,
  AddFolderShardPerInputOutputItem,
  AddFolderShardMeta
>;

export type AddFolderShardRunner = ShardRunner<
  AddFolderShardNewFolderInput,
  AddFolderShardPerInputOutputItem,
  AddFolderShardMeta
>;

export const kAddFolderShardRunnerPrefix = 'addFolder' as const;

export interface IAddFolderQueueInput
  extends NewFolderInput,
    IQueueMessage,
    Agent {
  channel: string;
  workspaceId: string;
}

export interface IAddFolderQueueWorkingInput
  extends NewFolderInput,
    IQueueMessage {
  channel: string;
  workspaceId: string;
  agent: SessionAgent;
}

export const kAddFolderQueueOutputType = {
  error: 0,
  success: 1,
  ack: 2,
} as const;

export type IAddFolderQueueOutput =
  | {
      id: IQueueMessage['id'];
      type: typeof kAddFolderQueueOutputType.error;
      error: unknown;
    }
  | {
      id: IQueueMessage['id'];
      type: typeof kAddFolderQueueOutputType.success;
      folders: Folder[];
    }
  | {
      id: IQueueMessage['id'];
      type: typeof kAddFolderQueueOutputType.ack;
    };
