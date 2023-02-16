import {IPublicFile} from '../../../definitions/file';
import {IFolderMatcher, IPublicFolder} from '../../../definitions/folder';
import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IListFolderContentEndpointParamsBase extends IFolderMatcher {
  contentType?: Array<AppResourceType.File | AppResourceType.Folder>;
}

export interface IListFolderContentEndpointParams
  extends IListFolderContentEndpointParamsBase,
    IPaginationQuery {}

export interface IListFolderContentEndpointResult extends IPaginatedResult {
  folders: IPublicFolder[];
  files: IPublicFile[];
}

export type ListFolderContentEndpoint = Endpoint<
  IBaseContext,
  IListFolderContentEndpointParams,
  IListFolderContentEndpointResult
>;
