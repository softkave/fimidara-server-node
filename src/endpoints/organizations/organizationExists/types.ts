import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IOrganizationExistsParameters {
    name: string;
}

export interface IOrganizationExistsResult {
    exists: boolean;
}

export type OrganizationExistsEndpoint = Endpoint<
    IBaseContext,
    IOrganizationExistsParameters,
    IOrganizationExistsResult
>;
