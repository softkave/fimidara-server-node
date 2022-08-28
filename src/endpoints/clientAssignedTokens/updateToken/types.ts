import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {INewClientAssignedTokenInput} from '../addToken/types';

export type IUpdateClientAssignedTokenInput =
  Partial<INewClientAssignedTokenInput>;

export interface IUpdateClientAssignedTokenEndpointParams {
  tokenId?: string;
  onReferenced?: boolean;
  providedResourceId?: string;
  workspaceId?: string;
  token: IUpdateClientAssignedTokenInput;
}

export interface IUpdateClientAssignedTokenEndpointResult {
  token: IPublicClientAssignedToken;
}

export type UpdateClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IUpdateClientAssignedTokenEndpointParams,
  IUpdateClientAssignedTokenEndpointResult
>;
