import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetWorkspaceCollaboratorsEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {}

export interface IGetWorkspaceCollaboratorsEndpointParams
  extends IGetWorkspaceCollaboratorsEndpointParamsBase,
    IPaginationQuery {}

export interface IGetWorkspaceCollaboratorsEndpointResult extends IPaginatedResult {
  collaborators: IPublicCollaborator[];
}

export type GetWorkspaceCollaboratorsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceCollaboratorsEndpointParams,
  IGetWorkspaceCollaboratorsEndpointResult
>;
