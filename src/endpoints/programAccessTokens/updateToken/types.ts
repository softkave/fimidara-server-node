import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewProgramAccessTokenInput} from '../addToken/types';

export type IUpdateProgramAccessTokenInput =
  Partial<INewProgramAccessTokenInput>;

export interface IUpdateProgramAccessTokenParams {
  tokenId?: string;
  onReferenced?: boolean;
  token: IUpdateProgramAccessTokenInput;
}

export interface IUpdateProgramAccessTokenResult {
  token: IPublicProgramAccessToken;
}

export type UpdateProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IUpdateProgramAccessTokenParams,
  IUpdateProgramAccessTokenResult
>;
