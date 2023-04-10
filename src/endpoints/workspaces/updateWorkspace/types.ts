import {IPublicWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';
import {INewWorkspaceInput} from '../addWorkspace/types';

export type IUpdateWorkspaceInput = Partial<
  Omit<INewWorkspaceInput, 'rootname' | 'usageThresholds'>
>;

export interface IUpdateWorkspaceEndpointParams extends IEndpointOptionalWorkspaceIDParam {
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
