import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface DeleteFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  configId: string;
}

export type DeleteFileBackendConfigEndpoint = Endpoint<
  DeleteFileBackendConfigEndpointParams,
  LongRunningJobResult
>;
