import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface IngestFileBackendMountEndpointParams
  extends EndpointWorkspaceResourceParam {
  mountId: string;
}

export type IngestFileBackendMountEndpoint = Endpoint<
  BaseContextType,
  IngestFileBackendMountEndpointParams,
  LongRunningJobResult
>;
