import {Folder, PublicFolder} from '../../../definitions/folder.js';
import {SessionAgent} from '../../../definitions/system.js';
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

export interface IAddFolderQueueShardRunnerInput extends NewFolderInput {
  UNSAFE_skipAuthCheck?: boolean;
  throwIfFolderExists?: boolean;
  workspaceId: string;
}

export interface IAddFolderQueueWorkingInput extends NewFolderInput {
  id: string;
  workspaceId: string;
  agent: SessionAgent;
  UNSAFE_skipAuthCheck?: boolean;
  throwIfFolderExists?: boolean;
}

export type IAddFolderQueueShardRunnerOutput = Folder[];
