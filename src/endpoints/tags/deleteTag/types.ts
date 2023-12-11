import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export interface DeleteTagEndpointParams {
  tagId: string;
}

export type DeleteTagEndpoint = Endpoint<DeleteTagEndpointParams, LongRunningJobResult>;
