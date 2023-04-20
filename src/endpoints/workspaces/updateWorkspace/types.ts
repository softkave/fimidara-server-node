import {PublicWorkspace} from '../../../definitions/workspace';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {NewWorkspaceInput} from '../addWorkspace/types';

export type UpdateWorkspaceInput = Partial<Omit<NewWorkspaceInput, 'rootname' | 'usageThresholds'>>;

export interface UpdateWorkspaceEndpointParams extends EndpointOptionalWorkspaceIDParam {
  workspace: UpdateWorkspaceInput;
}

export interface UpdateWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type UpdateWorkspaceEndpoint = Endpoint<
  BaseContext,
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult
>;
