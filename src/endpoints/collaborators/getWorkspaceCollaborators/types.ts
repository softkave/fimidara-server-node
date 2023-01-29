import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetWorkspaceCollaboratorsEndpointParams extends IPaginationQuery {
  workspaceId?: string;
}

export interface IGetWorkspaceCollaboratorsEndpointResult extends IPaginatedResult {
  collaborators: IPublicCollaborator[];
}

export type GetWorkspaceCollaboratorsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceCollaboratorsEndpointParams,
  IGetWorkspaceCollaboratorsEndpointResult
>;
