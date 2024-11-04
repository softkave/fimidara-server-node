import {Folder, PublicFolder} from '../../../definitions/folder.js';
import {Agent, SessionAgent} from '../../../definitions/system.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  EndpointResultNote,
} from '../../types.js';

export interface NewFolderInput {
  /** folder path should include the workspace rootname */
  folderpath: string;
  description?: string;
}

export interface AddFolderEndpointParams
  extends NewFolderInput,
    EndpointOptionalWorkspaceIdParam {}

export interface AddFolderEndpointResult {
  folder: PublicFolder;
  notes?: EndpointResultNote[];
}

export type AddFolderEndpoint = Endpoint<
  AddFolderEndpointParams,
  AddFolderEndpointResult
>;

export interface IAddFolderQueueInput extends NewFolderInput, Agent {
  id: string;
  channel: string;
  workspaceId: string;
  UNSAFE_skipAuthCheck?: string;
  throwIfFolderExists?: string;
}

export interface IAddFolderQueueWorkingInput extends NewFolderInput {
  id: string;
  channel: string;
  workspaceId: string;
  agent: SessionAgent;
  UNSAFE_skipAuthCheck?: string;
  throwIfFolderExists?: string;
}

export const kAddFolderQueueOutputType = {
  error: 0,
  success: 1,
  ack: 2,
} as const;

export type IAddFolderQueueOutput =
  | {
      id: IAddFolderQueueInput['id'];
      type: typeof kAddFolderQueueOutputType.error;
      error: unknown;
    }
  | {
      id: IAddFolderQueueInput['id'];
      type: typeof kAddFolderQueueOutputType.success;
      folders: Folder[];
    }
  | {
      id: IAddFolderQueueInput['id'];
      type: typeof kAddFolderQueueOutputType.ack;
    };
