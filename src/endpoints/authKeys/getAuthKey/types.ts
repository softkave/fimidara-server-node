import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicAuthKey} from '../types';

export interface IGetAppointmentsEndpointParams {
    shopId: string;
}

export interface IGetAppointmentsEndpointResult {
    appointments: IPublicAuthKey[];
}

export type GetAppointmentsEndpoint = Endpoint<
    IBaseContext,
    IGetAppointmentsEndpointParams,
    IGetAppointmentsEndpointResult
>;
