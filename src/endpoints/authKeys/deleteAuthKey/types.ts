import {IBaseUserTokenData} from '../../AccessToken';
import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';
import {IPublicAuthKey} from '../types';

export interface IUpdateAppointmentInput {
    customerName?: string;
    customerPhone?: string;
    description?: string;
    time?: string;
}

export interface IUpdateAppointmentEndpointRequestToken {
    customerPhone: string;
}

export interface IUpdateAppointmentParams {
    appointmentId: string;
    data: IUpdateAppointmentInput;
}

export interface IUpdateAppointmentResult {
    appointment: IPublicAuthKey;
}

export type UpdateAppointmentEndpoint = Endpoint<
    IBaseContext,
    IUpdateAppointmentParams,
    IUpdateAppointmentResult,
    IBaseUserTokenData | IUpdateAppointmentEndpointRequestToken
>;
