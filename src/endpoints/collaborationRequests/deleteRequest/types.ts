import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IDeleteCollaborationRequestEndpointParams {
  requestId: string;
}

export type DeleteCollaborationRequestEndpoint = Endpoint<IBaseContext, IDeleteCollaborationRequestEndpointParams>;
