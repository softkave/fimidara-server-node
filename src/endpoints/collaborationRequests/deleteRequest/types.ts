import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteRequestParams {
  requestId: string;
}

export type DeleteRequestEndpoint = Endpoint<
  IBaseContext,
  IDeleteRequestParams
>;
