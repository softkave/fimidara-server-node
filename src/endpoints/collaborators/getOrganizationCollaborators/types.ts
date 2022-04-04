import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetOrganizationCollaboratorsEndpointParams {
  organizationId: string;
}

export interface IGetOrganizationCollaboratorsEndpointResult {
  collaborators: IPublicCollaborator[];
}

export type GetOrganizationCollaboratorsEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationCollaboratorsEndpointParams,
  IGetOrganizationCollaboratorsEndpointResult
>;
