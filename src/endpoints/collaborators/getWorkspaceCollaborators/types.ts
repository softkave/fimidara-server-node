import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetWorkspaceCollaboratorsEndpointParams {
  workspaceId: string;
}

export interface IGetWorkspaceCollaboratorsEndpointResult {
  collaborators: IPublicCollaborator[];
}

export type GetWorkspaceCollaboratorsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceCollaboratorsEndpointParams,
  IGetWorkspaceCollaboratorsEndpointResult
>;
