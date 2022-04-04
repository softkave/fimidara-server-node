import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetOrganizationClientAssignedTokensEndpointParams {
  organizationId: string;
}

export interface IGetOrganizationClientAssignedTokensEndpointResult {
  tokens: IPublicClientAssignedToken[];
}

export type GetOrganizationClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationClientAssignedTokensEndpointParams,
  IGetOrganizationClientAssignedTokensEndpointResult
>;
