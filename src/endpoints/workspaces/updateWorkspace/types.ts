import {PublicWorkspace} from '../../../definitions/workspace.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';
import {NewWorkspaceInput} from '../addWorkspace/types.js';

export type UpdateWorkspaceInput = Partial<Omit<NewWorkspaceInput, 'rootname'>>;

export interface UpdateWorkspaceEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  workspace: UpdateWorkspaceInput;
}

export interface UpdateWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type UpdateWorkspaceEndpoint = Endpoint<
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult
>;
