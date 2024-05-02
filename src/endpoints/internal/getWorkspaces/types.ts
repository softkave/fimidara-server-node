import {PublicWorkspace} from '../../../definitions/workspace.js';
import {Endpoint} from '../../types.js';

export interface GetWorkspacesEndpointParams {}

export interface GetWorkspacesEndpointResult {
  workspaceList: PublicWorkspace[];
}

export type GetWorkspacesEndpoint = Endpoint<
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult
>;
