import {PublicFileBackendMount} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, PaginatedResult} from '../../types';

export interface ResolveMountsEndpointParams {
  /* one of the following, in order, meaning the first one provided. */
  folderpath?: string;
  filepath?: string;
  folderId?: string;
  fileId?: string;
}

export interface ResolveMountsEndpointResult extends PaginatedResult {
  mounts: PublicFileBackendMount[];
}

export type ResolveMountsEndpoint = Endpoint<
  BaseContextType,
  ResolveMountsEndpointParams,
  ResolveMountsEndpointResult
>;
