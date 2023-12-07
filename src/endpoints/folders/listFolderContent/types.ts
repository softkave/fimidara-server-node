import {PublicFile} from '../../../definitions/file';
import {FolderMatcher, PublicFolder} from '../../../definitions/folder';
import {AppResourceType} from '../../../definitions/system';
import {BaseContextType} from '../../contexts/types';
import {
  Endpoint,
  EndpointResultNote,
  PaginatedResult,
  PaginationQuery,
} from '../../types';
import {FileProviderContinuationTokensByMount} from '../utils';

export interface ListFolderContentEndpointContinuationToken {
  files?: FileProviderContinuationTokensByMount;
  folders?: FileProviderContinuationTokensByMount;
}

export interface ListFolderContentEndpointParamsBase extends FolderMatcher {
  contentType?: AppResourceType;
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
  BaseContextType,
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult
>;
