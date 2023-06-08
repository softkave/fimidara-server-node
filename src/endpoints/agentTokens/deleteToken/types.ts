import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface DeleteAgentTokenEndpointParams extends EndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
}

export type DeleteAgentTokenEndpoint = Endpoint<
  BaseContextType,
  DeleteAgentTokenEndpointParams,
  LongRunningJobResult
>;
