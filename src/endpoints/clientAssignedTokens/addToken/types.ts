import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicClientAssignedToken} from '../types';

export interface INewClientAssignedTokenInput {
  expires?: number;
}

export interface IAddClientAssignedTokenParams {
  organizationId?: string;
  token: INewClientAssignedTokenInput;
}

export interface IAddClientAssignedTokenResult {
  token: IPublicClientAssignedToken;
  tokenStr: string;
}

export type AddClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IAddClientAssignedTokenParams,
  IAddClientAssignedTokenResult
>;
