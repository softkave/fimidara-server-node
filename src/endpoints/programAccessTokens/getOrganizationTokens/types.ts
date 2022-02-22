import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

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
