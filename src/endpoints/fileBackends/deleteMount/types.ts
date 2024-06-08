import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface DeleteFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  mountId: string;
}

export type DeleteFileBackendMountEndpoint = Endpoint<
  DeleteFileBackendMountEndpointParams,
  LongRunningJobResult
>;
