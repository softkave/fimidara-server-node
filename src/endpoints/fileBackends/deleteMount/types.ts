import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface DeleteFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  mountId: string;
}

export type DeleteFileBackendMountEndpoint = Endpoint<
  DeleteFileBackendMountEndpointParams,
  LongRunningJobResult
>;
