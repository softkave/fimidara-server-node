import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetRequestWorkspaceEndpointParams {
  workspaceId: string;
}

export interface IPublicRequestWorkspace {
  workspaceId: string;
  name: string;
}

export interface IGetRequestWorkspaceEndpointResult {
  workspace: IPublicRequestWorkspace;
}

export type GetRequestWorkspaceEndpoint = Endpoint<
  IBaseContext,
  IGetRequestWorkspaceEndpointParams,
  IGetRequestWorkspaceEndpointResult
>;
