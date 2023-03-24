import {IBaseContext} from '../../contexts/types';
import {ILongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export interface IDeleteCollaborationRequestEndpointParams {
  requestId: string;
}

export type DeleteCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  IDeleteCollaborationRequestEndpointParams,
  ILongRunningJobResult
>;
