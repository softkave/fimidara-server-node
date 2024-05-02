import {PublicFileBackendMount} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

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
  ResolveFileBackendMountsEndpointParams,
  ResolveFileBackendMountsEndpointResult
>;
