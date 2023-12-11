import {PublicWorkspace} from '../../../definitions/workspace';
import {Endpoint} from '../../types';

export interface GetWorkspacesEndpointParams {}

export interface GetWorkspacesEndpointResult {
  workspaceList: PublicWorkspace[];
}

export type GetWorkspacesEndpoint = Endpoint<
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult
>;
