import {IFolderMatcher, IPublicFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IGetFolderEndpointParams = IFolderMatcher;
export interface IGetFolderEndpointResult {
  folder: IPublicFolder;
}

export type GetFolderEndpoint = Endpoint<
  IBaseContext,
  IGetFolderEndpointParams,
  IGetFolderEndpointResult
>;
