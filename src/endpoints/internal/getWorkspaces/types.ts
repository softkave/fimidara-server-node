import {PublicWorkspace} from '../../../definitions/workspace';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetWorkspacesEndpointParams {}

export interface GetWorkspacesEndpointResult {
  workspaceList: PublicWorkspace[];
}

export type GetWorkspacesEndpoint = Endpoint<
  BaseContextType,
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult
>;
