import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteClientAssignedTokenEndpointParams {
  tokenId?: string;
  providedResourceId?: string;
  organizationId?: string;
  onReferenced?: boolean;
}

export type DeleteClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IDeleteClientAssignedTokenEndpointParams
>;
