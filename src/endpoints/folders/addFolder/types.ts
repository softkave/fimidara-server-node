import {IPublicFolder} from '../../../definitions/folder';
import {IPublicAccessOpInput} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewFolderInput {
  folderPath: string;
  description?: string;
  maxFileSizeInBytes?: number;

  // TODO: validate that actions and types belong to the resource
  // TODO: should we instead use an S3-like approach? Something like
  // "authenticated-read" | "private" | "public-read" | "public-read-write"
  publicAccessOps?: IPublicAccessOpInput[];

  // Defaults to true
  // inheritParentPublicAccessOps?: boolean;
}

export interface IAddFolderParams {
  organizationId?: string;
  folder: INewFolderInput;
}

export interface IAddFolderResult {
  folder: IPublicFolder;
}

export type AddFolderEndpoint = Endpoint<
  IBaseContext,
  IAddFolderParams,
  IAddFolderResult
>;
