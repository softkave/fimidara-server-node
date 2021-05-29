import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';
import {IPublicAppointment} from '../types';

export interface IGetAppointmentsEndpointParams {
    shopId: string;
}

export interface IGetAppointmentsEndpointResult {
    appointments: IPublicAppointment[];
}

export type GetAppointmentsEndpoint = Endpoint<
    IBaseContext,
    IGetAppointmentsEndpointParams,
    IGetAppointmentsEndpointResult
>;
