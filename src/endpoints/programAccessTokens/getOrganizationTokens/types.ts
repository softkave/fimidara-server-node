import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicProgramAccessToken} from '../types';

export interface IGetOrganizationProgramAccessTokensParams {
  organizationId: string;
}

export interface IGetOrganizationProgramAccessTokensResult {
  tokens: IPublicProgramAccessToken[];
}

export type GetOrganizationProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationProgramAccessTokensParams,
  IGetOrganizationProgramAccessTokensResult
>;
