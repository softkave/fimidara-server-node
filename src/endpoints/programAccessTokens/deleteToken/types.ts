import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteProgramAccessTokenEndpointParams {
  tokenId?: string;
  onReferenced?: boolean;
}

export type DeleteProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IDeleteProgramAccessTokenEndpointParams
>;
