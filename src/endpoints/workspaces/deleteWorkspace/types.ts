import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IDeleteWorkspaceEndpointParams {
  workspaceId?: string;
}

export type DeleteWorkspaceEndpoint = Endpoint<IBaseContext, IDeleteWorkspaceEndpointParams>;
