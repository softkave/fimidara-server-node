import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetClientAssignedTokenEndpointParams {
  tokenId?: string;
  providedResourceId?: string;
  workspaceId?: string;
  onReferenced?: boolean;
}

export interface IGetClientAssignedTokenEndpointResult {
  token: IPublicClientAssignedToken;
}

export type GetClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IGetClientAssignedTokenEndpointParams,
  IGetClientAssignedTokenEndpointResult
>;
