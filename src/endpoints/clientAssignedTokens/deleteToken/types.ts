import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteClientAssignedTokenParams {
  tokenId: string;
}

export type DeleteClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IDeleteClientAssignedTokenParams
>;
