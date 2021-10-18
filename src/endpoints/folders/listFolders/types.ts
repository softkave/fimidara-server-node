import {IBaseContext} from '../../contexts/BaseContext';
import {IPublicFolder} from '../types';
import {Endpoint} from '../../types';

export interface IGetFoldersEndpointParams {
  bucketId?: string;
  parentFolderId?: string;
  parentFolderPath?: string;
}

export interface IGetFoldersEndpointResult {
  folders: IPublicFolder[];
}

export type GetFoldersEndpoint = Endpoint<
  IBaseContext,
  IGetFoldersEndpointParams,
  IGetFoldersEndpointResult
>;
