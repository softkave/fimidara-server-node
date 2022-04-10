import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteTagEndpointParams {
  tagId: string;
}

export type DeleteTagEndpoint = Endpoint<
  IBaseContext,
  IDeleteTagEndpointParams
>;
