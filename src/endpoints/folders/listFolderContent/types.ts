import {IPublicFile} from '../../../definitions/file';
import {IFolderMatcher, IPublicFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IListFolderContentEndpointParams extends IFolderMatcher {}
export interface IListFolderContentEndpointResult {
  folders: IPublicFolder[];
  files: IPublicFile[];
}

export type ListFolderContentEndpoint = Endpoint<
  IBaseContext,
  IListFolderContentEndpointParams,
  IListFolderContentEndpointResult
>;
