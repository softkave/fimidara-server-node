import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IDeleteClientAssignedTokenEndpointParams {
  tokenId?: string;
  providedResourceId?: string;
  workspaceId?: string;
  onReferenced?: boolean;
}

export type DeleteClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IDeleteClientAssignedTokenEndpointParams
>;
