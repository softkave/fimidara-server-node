import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface DeleteFileBackendConfigEndpointParams
  extends EndpointWorkspaceResourceParam {
  configId: string;
}

export type DeleteFileBackendConfigEndpoint = Endpoint<
  BaseContextType,
  DeleteFileBackendConfigEndpointParams,
  LongRunningJobResult
>;
