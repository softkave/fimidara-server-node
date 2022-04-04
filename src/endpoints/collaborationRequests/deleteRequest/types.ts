import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteRequestEndpointParams {
  requestId: string;
}

export type DeleteRequestEndpoint = Endpoint<
  IBaseContext,
  IDeleteRequestEndpointParams
>;
