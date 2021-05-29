import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteOrganizationParams {
    organizationId: string;
}

export type DeleteOrganizationEndpoint = Endpoint<
    IBaseContext,
    IDeleteOrganizationParams
>;
