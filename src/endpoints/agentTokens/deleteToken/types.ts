import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IDeleteAgentTokenEndpointParams {
  tokenId?: string;
  onReferenced?: boolean;
}

export type DeleteAgentTokenEndpoint = Endpoint<IBaseContext, IDeleteAgentTokenEndpointParams>;
