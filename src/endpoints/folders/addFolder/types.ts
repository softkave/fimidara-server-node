import {IQueueMessage} from '../../../contexts/queue/types.js';
import {Folder, PublicFolder} from '../../../definitions/folder.js';
import {Agent, SessionAgent} from '../../../definitions/system.js';
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

export interface IAddFolderQueueInput
  extends NewFolderInput,
    IQueueMessage,
    Agent {
  channel: string;
  workspaceId: string;
  UNSAFE_skipAuthCheck?: boolean;
  throwIfFolderExists?: boolean;
}

export interface IAddFolderQueueWorkingInput
  extends NewFolderInput,
    IQueueMessage {
  channel: string;
  workspaceId: string;
  agent: SessionAgent;
  UNSAFE_skipAuthCheck?: boolean;
  throwIfFolderExists?: boolean;
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
