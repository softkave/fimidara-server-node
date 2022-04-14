import {IPublicWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetWorkspaceEndpointParams {
  workspaceId?: string;
}

export interface IGetWorkspaceEndpointResult {
  workspace: IPublicWorkspace;
}

export type GetWorkspaceEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceEndpointParams,
  IGetWorkspaceEndpointResult
>;
