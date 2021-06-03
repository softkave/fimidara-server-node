import {IBaseContext} from '../../contexts/BaseContext';
import {IPublicOrganization} from '../types';
import {Endpoint} from '../../types';

export interface IGetOrganizationEndpointParams {
    organizationId: string;
}

export interface IGetOrganizationEndpointResult {
    organization: IPublicOrganization;
}

export type GetOrganizationEndpoint = Endpoint<
    IBaseContext,
    IGetOrganizationEndpointParams,
    IGetOrganizationEndpointResult
>;
