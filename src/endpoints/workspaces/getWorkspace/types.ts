import {PublicWorkspace} from '../../../definitions/workspace';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface GetWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type GetWorkspaceEndpoint = Endpoint<
  EndpointOptionalWorkspaceIDParam,
  GetWorkspaceEndpointResult
>;
