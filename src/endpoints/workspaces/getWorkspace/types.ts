import {IPublicWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface IGetWorkspaceEndpointResult {
  workspace: IPublicWorkspace;
}

export type GetWorkspaceEndpoint = Endpoint<
  IBaseContext,
  IEndpointOptionalWorkspaceIDParam,
  IGetWorkspaceEndpointResult
>;
