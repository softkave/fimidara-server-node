import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export interface DeleteCollaborationRequestEndpointParams {
  requestId: string;
}

export type DeleteCollaborationRequestEndpoint = Endpoint<
  BaseContextType,
  DeleteCollaborationRequestEndpointParams,
  LongRunningJobResult
>;
