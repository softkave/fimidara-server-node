import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewClientAssignedTokenInput} from '../addToken/types';
import {IPublicClientAssignedToken} from '../types';

export type IUpdateClientAssignedTokenInput =
  Partial<INewClientAssignedTokenInput>;

export interface IUpdateClientAssignedTokenParams {
  tokenId?: string;
  onReferenced?: boolean;
  providedResourceId?: string;
  organizationId?: string;
  data: IUpdateClientAssignedTokenInput;
}

export interface IUpdateClientAssignedTokenResult {
  token: IPublicClientAssignedToken;
}

export type UpdateClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IUpdateClientAssignedTokenParams,
  IUpdateClientAssignedTokenResult
>;
