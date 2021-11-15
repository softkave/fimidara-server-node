import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicClientAssignedToken} from '../types';

export interface INewClientAssignedTokenInput {
  organizationId: string;
  environmentId: string;
  // bucketId: string;
  expires?: number;
}

export interface IAddClientAssignedTokenParams {
  token: INewClientAssignedTokenInput;
}

export interface IAddClientAssignedTokenResult {
  token: IPublicClientAssignedToken;
}

export type AddClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IAddClientAssignedTokenParams,
  IAddClientAssignedTokenResult
>;
