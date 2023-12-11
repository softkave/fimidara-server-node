import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export interface DeleteCollaborationRequestEndpointParams {
  requestId: string;
}

export type DeleteCollaborationRequestEndpoint = Endpoint<
  DeleteCollaborationRequestEndpointParams,
  LongRunningJobResult
>;
