import {IPublicOrganization} from '../../../definitions/organization';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewOrganizationInput} from '../addOrganization/types';

export type IUpdateOrganizationInput = Partial<INewOrganizationInput>;

export interface IUpdateOrganizationEndpointParams {
  organizationId: string;
  organization: IUpdateOrganizationInput;
}

export interface IUpdateOrganizationEndpointResult {
  organization: IPublicOrganization;
}

export type UpdateOrganizationEndpoint = Endpoint<
  IBaseContext,
  IUpdateOrganizationEndpointParams,
  IUpdateOrganizationEndpointResult
>;
