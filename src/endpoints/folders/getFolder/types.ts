import {IPublicFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetFolderEndpointParams {
  // folderId?: string;
  organizationId?: string;
  path: string;
}

export interface IGetFolderEndpointResult {
  folder: IPublicFolder;
}

export type GetFolderEndpoint = Endpoint<
  IBaseContext,
  IGetFolderEndpointParams,
  IGetFolderEndpointResult
>;
