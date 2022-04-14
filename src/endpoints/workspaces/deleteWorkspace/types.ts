import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteWorkspaceParams {
  workspaceId?: string;
}

export type DeleteWorkspaceEndpoint = Endpoint<
  IBaseContext,
  IDeleteWorkspaceParams
>;
