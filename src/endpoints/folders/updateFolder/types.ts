import {IPublicFolder} from '../../../definitions/folder';
import {IPublicAccessOpInput} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateFolderInput {
  description?: string;
  maxFileSizeInBytes?: number;
  publicAccessOps?: IPublicAccessOpInput[];
  removePublicAccessOps?: boolean;
}

export interface IUpdateFolderParams {
  // folderId: string;
  organizationId?: string;
  path: string;
  folder: IUpdateFolderInput;
}

export interface IUpdateFolderResult {
  folder: IPublicFolder;
}

export type UpdateFolderEndpoint = Endpoint<
  IBaseContext,
  IUpdateFolderParams,
  IUpdateFolderResult
>;
