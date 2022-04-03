import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetOrganizationCollaboratorsParams {
  organizationId: string;
}

export interface IGetOrganizationCollaboratorsResult {
  collaborators: IPublicCollaborator[];
}

export type GetOrganizationCollaboratorsEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationCollaboratorsParams,
  IGetOrganizationCollaboratorsResult
>;
