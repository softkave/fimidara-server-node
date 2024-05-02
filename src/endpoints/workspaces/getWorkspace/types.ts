import {PublicWorkspace} from '../../../definitions/workspace.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface GetWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type GetWorkspaceEndpoint = Endpoint<
  EndpointOptionalWorkspaceIDParam,
  GetWorkspaceEndpointResult
>;
