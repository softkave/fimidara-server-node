import {IPublicFolder} from '../../../definitions/folder';
import {IPublicAccessOpInput} from '../../../definitions/system';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewFolderInput {
  folderpath: string;
  description?: string;
  maxFileSizeInBytes?: number;

  // TODO: validate that actions and types belong to the resource
  // TODO: should we instead use an S3-like approach? Something like
  // "authenticated-read" | "private" | "public-read" | "public-read-write"
  publicAccessOps?: IPublicAccessOpInput[];
  tags?: IAssignedTagInput[];
}

export interface IAddFolderEndpointParams {
  workspaceId?: string;
  folder: INewFolderInput;
}

export interface IAddFolderEndpointResult {
  folder: IPublicFolder;
}

export type AddFolderEndpoint = Endpoint<
  IBaseContext,
  IAddFolderEndpointParams,
  IAddFolderEndpointResult
>;
