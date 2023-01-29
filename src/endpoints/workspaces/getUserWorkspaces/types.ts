import {IPublicWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetUserWorkspacesEndpointParams extends IPaginationQuery {}

export interface IGetUserWorkspacesEndpointResult extends IPaginatedResult {
  workspaces: IPublicWorkspace[];
}

export type GetUserWorkspacesEndpoint = Endpoint<
  IBaseContext,
  IGetUserWorkspacesEndpointParams,
  IGetUserWorkspacesEndpointResult
>;
