import {PublicFile} from '../../../definitions/file';
import {FolderMatcher, PublicFolder} from '../../../definitions/folder';
import {FimidaraResourceType} from '../../../definitions/system';
import {
  Endpoint,
  EndpointResultNote,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export interface ListFolderContentEndpointParamsBase extends FolderMatcher {
  contentType?: FimidaraResourceType;
}

export interface ListFolderContentEndpointParams
  extends ListFolderContentEndpointParamsBase,
    PaginationQuery {}

export interface ListFolderContentEndpointResult extends PaginatedResult {
  folders: PublicFolder[];
  files: PublicFile[];
  notes?: EndpointResultNote[];
}

export type ListFolderContentEndpoint = Endpoint<
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult
>;
