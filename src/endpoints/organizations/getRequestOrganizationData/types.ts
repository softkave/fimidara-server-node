import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetRequestOrganizationDataEndpointParams {
  organizationId: string;
}

export interface IPublicRequestOrganizationData {
  organizationId: string;
  name: string;
  description?: string;
}

export interface IGetRequestOrganizationDataEndpointResult {
  organization: IPublicRequestOrganizationData;
}

export type GetRequestOrganizationDataEndpoint = Endpoint<
  IBaseContext,
  IGetRequestOrganizationDataEndpointParams,
  IGetRequestOrganizationDataEndpointResult
>;
