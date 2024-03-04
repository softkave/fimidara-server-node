import {Folder, PublicFolder} from '../../../definitions/folder';
import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {Shard, ShardRunner} from '../../../utils/shardedRunnerQueue';
import {SemanticProviderMutationTxnOptions} from '../../contexts/semantic/types';
import {Endpoint, EndpointResultNote} from '../../types';

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
  opts: SemanticProviderMutationTxnOptions | undefined;
}

export type AddFolderShardOutputItem = {newFolders: Folder[]; existingFolders: Folder[]};
export type AddFolderShard = Shard<
  NewFolderInput,
  AddFolderShardOutputItem,
  AddFolderShardMeta
>;

export type AddFolderShardRunner = ShardRunner<
  NewFolderInput,
  AddFolderShardOutputItem,
  AddFolderShardMeta
>;

export const kAddFolderShardPart = 'addFolder' as const;
