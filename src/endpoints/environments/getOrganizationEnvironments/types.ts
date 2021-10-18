import {IBaseContext} from '../../contexts/BaseContext';
import {IPublicEnvironment} from '../types';
import {Endpoint} from '../../types';

export interface IGetOrganizationEnvironmentsEndpointParams {
  organizationId: string;
}

export interface IGetOrganizationEnvironmentsEndpointResult {
  environments: IPublicEnvironment[];
}

export type GetOrganizationEnvironmentsEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationEnvironmentsEndpointParams,
  IGetOrganizationEnvironmentsEndpointResult
>;
