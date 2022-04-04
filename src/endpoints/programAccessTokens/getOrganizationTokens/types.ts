import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetOrganizationProgramAccessTokensEndpointParams {
  organizationId: string;
}

export interface IGetOrganizationProgramAccessTokensEndpointResult {
  tokens: IPublicProgramAccessToken[];
}

export type GetOrganizationProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationProgramAccessTokensEndpointParams,
  IGetOrganizationProgramAccessTokensEndpointResult
>;
