import {PublicFileBackendMount} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface ResolveFileBackendMountsEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
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
  ResolveFileBackendMountsEndpointParams,
  ResolveFileBackendMountsEndpointResult
>;
