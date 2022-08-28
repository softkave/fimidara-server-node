import {IPublicTag} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetWorkspaceTagsEndpointParams {
  workspaceId?: string;
}

export interface IGetWorkspaceTagsEndpointResult {
  tags: IPublicTag[];
}

export type GetWorkspaceTagEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceTagsEndpointParams,
  IGetWorkspaceTagsEndpointResult
>;
