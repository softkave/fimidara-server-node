import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFolder} from '../types';

export interface IUpdateFolderInput {
  description?: string;
  maxFileSize?: number;
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
