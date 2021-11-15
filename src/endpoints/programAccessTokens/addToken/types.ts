import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicProgramAccessToken} from '../types';

export interface IAddProgramAccessTokenParams {
  organizationId: string;
  environmentId: string;
}

export interface IAddProgramAccessTokenResult {
  token: IPublicProgramAccessToken;
}

export type AddProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IAddProgramAccessTokenParams,
  IAddProgramAccessTokenResult
>;
