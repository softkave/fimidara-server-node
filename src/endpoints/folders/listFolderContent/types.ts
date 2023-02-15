import {IPublicFile} from '../../../definitions/file';
import {IFolderMatcher, IPublicFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export type IListFolderContentEndpointParamsBase = IFolderMatcher;
export type IListFolderContentEndpointParams = IListFolderContentEndpointParamsBase &
  IPaginationQuery;

export interface IListFolderContentEndpointResult extends IPaginatedResult {
  folders: IPublicFolder[];
  files: IPublicFile[];
}

export type ListFolderContentEndpoint = Endpoint<
  IBaseContext,
  IListFolderContentEndpointParams,
  IListFolderContentEndpointResult
>;
