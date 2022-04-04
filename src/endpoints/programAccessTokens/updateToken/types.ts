import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewProgramAccessTokenInput} from '../addToken/types';

export type IUpdateProgramAccessTokenInput =
  Partial<INewProgramAccessTokenInput>;

export interface IUpdateProgramAccessTokenEndpointParams {
  tokenId?: string;
  onReferenced?: boolean;
  token: IUpdateProgramAccessTokenInput;
}

export interface IUpdateProgramAccessTokenEndpointResult {
  token: IPublicProgramAccessToken;
}

export type UpdateProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IUpdateProgramAccessTokenEndpointParams,
  IUpdateProgramAccessTokenEndpointResult
>;
