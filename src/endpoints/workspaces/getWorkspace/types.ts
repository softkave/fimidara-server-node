import {PublicWorkspace} from '../../../definitions/workspace';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface GetWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type GetWorkspaceEndpoint = Endpoint<
  BaseContext,
  EndpointOptionalWorkspaceIDParam,
  GetWorkspaceEndpointResult
>;
