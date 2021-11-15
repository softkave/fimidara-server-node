import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicClientAssignedToken} from '../types';

export interface IGetEnvironmentClientAssignedTokensParams {
  environmentId: string;
}

export interface IGetEnvironmentClientAssignedTokensResult {
  tokens: IPublicClientAssignedToken[];
}

export type GetEnvironmentClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IGetEnvironmentClientAssignedTokensParams,
  IGetEnvironmentClientAssignedTokensResult
>;
