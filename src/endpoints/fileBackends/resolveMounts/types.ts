import {PublicFileBackendMount} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface ResolveFileBackendMountsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  /* one of the following, in order, meaning the first one provided. */
  folderpath?: string;
  filepath?: string;
  folderId?: string;
  fileId?: string;
}

export interface ResolveFileBackendMountsEndpointResult {
  mounts: PublicFileBackendMount[];
}

export type ResolveFileBackendMountsEndpoint = Endpoint<
  BaseContextType,
  ResolveFileBackendMountsEndpointParams,
  ResolveFileBackendMountsEndpointResult
>;
