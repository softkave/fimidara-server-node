import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint} from '../../types.js';

export interface DeleteTagEndpointParams {
  tagId: string;
}

export type DeleteTagEndpoint = Endpoint<DeleteTagEndpointParams, LongRunningJobResult>;
