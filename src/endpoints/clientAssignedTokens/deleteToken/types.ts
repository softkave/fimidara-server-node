import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteClientAssignedTokenParams {
  tokenId?: string;
  providedResourceId?: string;
  onReferenced?: boolean;
}

export type DeleteClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IDeleteClientAssignedTokenParams
>;
