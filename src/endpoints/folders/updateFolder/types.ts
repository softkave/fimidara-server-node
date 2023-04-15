import {IFolderMatcher, IPublicFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUpdateFolderInput {
  description?: string;
  removePublicAccessOps?: boolean;
}

export interface IUpdateFolderEndpointParams extends IFolderMatcher {
  folder: IUpdateFolderInput;
}

export interface IUpdateFolderEndpointResult {
  folder: IPublicFolder;
}

export type UpdateFolderEndpoint = Endpoint<
  IBaseContext,
  IUpdateFolderEndpointParams,
  IUpdateFolderEndpointResult
>;
