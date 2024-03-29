import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface DeleteFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  configId: string;
}

export type DeleteFileBackendConfigEndpoint = Endpoint<
  DeleteFileBackendConfigEndpointParams,
  LongRunningJobResult
>;
