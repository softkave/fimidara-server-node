import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteProgramAccessTokenParams {
  tokenId?: string;
  onReferenced?: boolean;
}

export type DeleteProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IDeleteProgramAccessTokenParams
>;
