import {PublicWorkspace} from '../../../definitions/workspace';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface GetWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type GetWorkspaceEndpoint = Endpoint<
  BaseContextType,
  EndpointOptionalWorkspaceIDParam,
  GetWorkspaceEndpointResult
>;
