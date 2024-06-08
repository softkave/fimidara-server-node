import {PublicWorkspace} from '../../../definitions/workspace.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';
import {NewWorkspaceInput} from '../addWorkspace/types.js';

export type UpdateWorkspaceInput = Partial<
  Omit<NewWorkspaceInput, 'rootname' | 'usageThresholds'>
>;

export interface UpdateWorkspaceEndpointParams extends EndpointOptionalWorkspaceIDParam {
  workspace: UpdateWorkspaceInput;
}

export interface UpdateWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type UpdateWorkspaceEndpoint = Endpoint<
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult
>;
