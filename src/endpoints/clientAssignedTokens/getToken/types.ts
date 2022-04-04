import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetClientAssignedTokenEndpointParams {
  tokenId?: string;
  providedResourceId?: string;
  organizationId?: string;
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
