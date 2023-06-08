import {PublicFile} from '../../../definitions/file';
import {FolderMatcher, PublicFolder} from '../../../definitions/folder';
import {AppResourceType} from '../../../definitions/system';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types';

export interface ListFolderContentEndpointParamsBase extends FolderMatcher {
  contentType?: AppResourceType;
}

export interface ListFolderContentEndpointParams
  extends ListFolderContentEndpointParamsBase,
    PaginationQuery {}

export interface ListFolderContentEndpointResult extends PaginatedResult {
  folders: PublicFolder[];
  files: PublicFile[];
}

export type ListFolderContentEndpoint = Endpoint<
  BaseContextType,
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult
>;
