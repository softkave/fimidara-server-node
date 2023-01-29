import {IPublicTag} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetWorkspaceTagsEndpointParams extends IPaginationQuery {
  workspaceId?: string;
}

export interface IGetWorkspaceTagsEndpointResult extends IPaginatedResult {
  tags: IPublicTag[];
}

export type GetWorkspaceTagEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceTagsEndpointParams,
  IGetWorkspaceTagsEndpointResult
>;
