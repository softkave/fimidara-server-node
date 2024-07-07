import {Folder, PublicFolder} from '../../../definitions/folder.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {Shard, ShardRunner} from '../../../utils/shardedRunnerQueue.js';
import {Endpoint, EndpointResultNote} from '../../types.js';

export interface NewFolderInput {
  // folder path should include the workspace rootname
  folderpath: string;
  description?: string;
}

export interface AddFolderEndpointParams {
  folder: NewFolderInput;
}

export interface AddFolderEndpointResult {
  folder: PublicFolder;
  notes?: EndpointResultNote[];
}

export type AddFolderEndpoint = Endpoint<
  AddFolderEndpointParams,
  AddFolderEndpointResult
>;

export interface AddFolderShardMeta {
  agent: SessionAgent;
  workspace: Workspace;
  UNSAFE_skipAuthCheck: boolean;
  throwOnFolderExists: boolean;
}

export type FoldersByNamepath = Record<string, Folder[]>;
export type AddFolderShardPerInputOutputItem = Folder[];

export type AddFolderShard = Shard<
  NewFolderInput,
  AddFolderShardPerInputOutputItem,
  AddFolderShardMeta
>;

export type AddFolderShardRunner = ShardRunner<
  NewFolderInput,
  AddFolderShardPerInputOutputItem,
  AddFolderShardMeta
>;

export const kAddFolderShardRunnerPrefix = 'addFolder' as const;
