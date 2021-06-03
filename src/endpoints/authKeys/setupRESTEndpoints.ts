import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import addAuthKey from './addAuthKey/handler';
import {Express} from 'express';
import updateAppointment from './deleteAuthKey/handler';
import getAppointments from './getAuthKey/handler';

export default function setupAuthKeyRESTEndpoints(
    connection: Connection,
    app: Express
) {
    const endpoints = {
        addAppointment: wrapEndpointREST(
            addAuthKey,
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
