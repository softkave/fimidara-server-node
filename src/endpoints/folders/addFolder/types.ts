import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFolder} from '../types';

export interface INewFolderInput {
  path: string;
  description?: string;
  maxFileSizeInBytes?: number;
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
