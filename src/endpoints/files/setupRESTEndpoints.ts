import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import addAppointment from './addAppointment/handler';
import {Express} from 'express';
import updateAppointment from './updateAppointment/handler';
import getAppointments from './getAppointments/handler';

export default function setupAppointmentRESTEndpoints(
    connection: Connection,
    app: Express
) {
    const endpoints = {
        addAppointment: wrapEndpointREST(
            addAppointment,
            getBaseContext(connection)
        ),
        updateAppointment: wrapEndpointREST(
            updateAppointment,
            getBaseContext(connection)
        ),
        getAppointments: wrapEndpointREST(
            getAppointments,
            getBaseContext(connection)
        ),
    };

    app.post('/appointments/setAppointment', endpoints.addAppointment);
    app.post('/appointments/updateAppointment', endpoints.updateAppointment);
    app.post('/appointments/getAppointments', endpoints.getAppointments);
}
