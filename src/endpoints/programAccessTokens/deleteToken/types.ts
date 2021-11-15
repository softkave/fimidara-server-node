import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteProgramAccessTokenParams {
  tokenId: string;
}

export type DeleteProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IDeleteProgramAccessTokenParams
>;
