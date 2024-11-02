import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface DeleteFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  mountId: string;
}

export type DeleteFileBackendMountEndpoint = Endpoint<
  DeleteFileBackendMountEndpointParams,
  LongRunningJobResult
>;
