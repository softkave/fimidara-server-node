import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFolder} from '../types';

export interface INewFolderInput {
  organizationId: string;
  environmentId: string;
  bucketId: string;
  path: string;
  parentId?: string;
  description?: string;
  maxFileSize?: number;
}

export interface IAddFolderParams {
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
