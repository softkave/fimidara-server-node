import {PublicCollaborator} from '../../../definitions/user';
import {BaseContext} from '../../contexts/types';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export interface GetWorkspaceCollaboratorsEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {}

export interface GetWorkspaceCollaboratorsEndpointParams
  extends GetWorkspaceCollaboratorsEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspaceCollaboratorsEndpointResult extends PaginatedResult {
  collaborators: PublicCollaborator[];
}

export type GetWorkspaceCollaboratorsEndpoint = Endpoint<
  BaseContext,
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult
>;
