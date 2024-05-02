import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint} from '../../types.js';

export interface DeleteCollaborationRequestEndpointParams {
  requestId: string;
}

export type DeleteCollaborationRequestEndpoint = Endpoint<
  DeleteCollaborationRequestEndpointParams,
  LongRunningJobResult
>;
