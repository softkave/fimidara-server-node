import {IBaseContext} from '../../contexts/types';
import {ILongRunningJobResult} from '../../jobs/types';
import {Endpoint, IEndpointWorkspaceResourceParam} from '../../types';

export interface IDeleteAgentTokenEndpointParams extends IEndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
}

export type DeleteAgentTokenEndpoint = Endpoint<
  IBaseContext,
  IDeleteAgentTokenEndpointParams,
  ILongRunningJobResult
>;
