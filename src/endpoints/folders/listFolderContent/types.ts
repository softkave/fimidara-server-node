import {PublicFile} from '../../../definitions/file.js';
import {FolderMatcher, PublicFolder} from '../../../definitions/folder.js';
import {FimidaraResourceType} from '../../../definitions/system.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  EndpointResultNote,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface ListFolderContentEndpointParamsBase
  extends FolderMatcher,
    EndpointOptionalWorkspaceIdParam {
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
