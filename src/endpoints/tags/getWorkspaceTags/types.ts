import {IPublicTag} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetWorkspaceTagsEndpointParamsBase extends IEndpointOptionalWorkspaceIDParam {}

export interface IGetWorkspaceTagsEndpointParams
  extends IGetWorkspaceTagsEndpointParamsBase,
    IPaginationQuery {}

export interface IGetWorkspaceTagsEndpointResult extends IPaginatedResult {
  tags: IPublicTag[];
}

export type GetWorkspaceTagEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceTagsEndpointParams,
  IGetWorkspaceTagsEndpointResult
>;
