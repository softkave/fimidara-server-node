import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicClientAssignedToken} from '../types';

export interface IGetOrganizationClientAssignedTokensParams {
  organizationId: string;
}

export interface IGetOrganizationClientAssignedTokensResult {
  tokens: IPublicClientAssignedToken[];
}

export type GetOrganizationClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationClientAssignedTokensParams,
  IGetOrganizationClientAssignedTokensResult
>;
