import {PublicWorkspace} from '../../../definitions/workspace.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetWorkspaceEndpointParams
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type GetWorkspaceEndpoint = Endpoint<
  GetWorkspaceEndpointParams,
  GetWorkspaceEndpointResult
>;
