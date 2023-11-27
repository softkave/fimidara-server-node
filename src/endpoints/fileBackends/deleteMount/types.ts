import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface DeleteFileBackendMountEndpointParams
  extends EndpointWorkspaceResourceParam {
  mountId: string;
}

export type DeleteFileBackendMountEndpoint = Endpoint<
  BaseContextType,
  DeleteFileBackendMountEndpointParams,
  LongRunningJobResult
>;
