import {IPublicWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewWorkspaceInput} from '../addWorkspace/types';

export type IUpdateWorkspaceInput = Partial<
  Omit<INewWorkspaceInput, 'rootname' | 'usageThresholds'>
>;

export interface IUpdateWorkspaceEndpointParams {
  workspaceId?: string;
  workspace: IUpdateWorkspaceInput;
}

export interface IUpdateWorkspaceEndpointResult {
  workspace: IPublicWorkspace;
}

export type UpdateWorkspaceEndpoint = Endpoint<
  IBaseContext,
  IUpdateWorkspaceEndpointParams,
  IUpdateWorkspaceEndpointResult
>;
