import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface DeleteFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  configId: string;
}

export type DeleteFileBackendConfigEndpoint = Endpoint<
  DeleteFileBackendConfigEndpointParams,
  LongRunningJobResult
>;
