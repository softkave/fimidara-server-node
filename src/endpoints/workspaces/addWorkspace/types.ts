import {PublicWorkspace} from '../../../definitions/workspace.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface NewWorkspaceInput {
  name: string;
  rootname: string;
  description?: string;
}

export interface AddWorkspaceEndpointParams
  extends NewWorkspaceInput,
    EndpointOptionalWorkspaceIdParam {
  workspaceId?: string;
}

export interface AddWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type AddWorkspaceEndpoint = Endpoint<
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult
>;
