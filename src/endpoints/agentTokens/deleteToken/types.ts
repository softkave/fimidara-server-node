import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types.js';

export interface DeleteAgentTokenEndpointParams
  extends EndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
}

export type DeleteAgentTokenEndpoint = Endpoint<
  DeleteAgentTokenEndpointParams,
  LongRunningJobResult
>;
