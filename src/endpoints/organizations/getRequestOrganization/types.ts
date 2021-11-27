import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetRequestOrganizationEndpointParams {
  organizationId: string;
}

export interface IPublicRequestOrganization {
  organizationId: string;
  name: string;
}

export interface IGetRequestOrganizationEndpointResult {
  organization: IPublicRequestOrganization;
}

export type GetRequestOrganizationEndpoint = Endpoint<
  IBaseContext,
  IGetRequestOrganizationEndpointParams,
  IGetRequestOrganizationEndpointResult
>;
