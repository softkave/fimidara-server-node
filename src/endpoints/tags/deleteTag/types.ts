import {BaseContext} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export interface DeleteTagEndpointParams {
  tagId: string;
}

export type DeleteTagEndpoint = Endpoint<
  BaseContext,
  DeleteTagEndpointParams,
  LongRunningJobResult
>;
