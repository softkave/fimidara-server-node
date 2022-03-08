import {IPublicOrganization} from '../../../definitions/organization';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewOrganizationInput} from '../addOrganization/types';

export type IUpdateOrganizationInput = Partial<INewOrganizationInput>;

export interface IUpdateOrganizationParams {
  organizationId: string;
  organization: IUpdateOrganizationInput;
}

export interface IUpdateOrganizationResult {
  organization: IPublicOrganization;
}

export type UpdateOrganizationEndpoint = Endpoint<
  IBaseContext,
  IUpdateOrganizationParams,
  IUpdateOrganizationResult
>;
