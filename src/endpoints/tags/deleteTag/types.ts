import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IDeleteTagEndpointParams {
  tagId: string;
}

export type DeleteTagEndpoint = Endpoint<
  IBaseContext,
  IDeleteTagEndpointParams
>;
