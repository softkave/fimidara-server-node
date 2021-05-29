import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';
import {IPublicAppointment} from '../types';

export interface INewAppointmentInput {
    customerName: string;
    customerPhone: string;
    description?: string;
    time: string;
}

export interface IAddAppointmentParams {
    shopId: string;
    appointment: INewAppointmentInput;
}

export interface IAddAppointmentResult {
    appointment: IPublicAppointment;
}

export type AddAppointmentEndpoint = Endpoint<
    IBaseContext,
    IAddAppointmentParams,
    IAddAppointmentResult
>;
