import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addOrganization from './addOrganization/handler';
import deleteOrganization from './deleteOrganization/handler';
import getOrganization from './getOrganization/handler';
import getUserOrganizations from './getUserOrganizations/handler';
import organizationExists from './organizationExists/handler';
import updateOrganization from './updateOrganization/handler';

export default function setupOrganizationRESTEndpoints(
    connection: Connection,
    app: Express
) {
    const endpoints = {
        addOrganization: wrapEndpointREST(
            addOrganization,
            getBaseContext(connection)
        ),
        deleteOrganization: wrapEndpointREST(
            deleteOrganization,
            getBaseContext(connection)
        ),
        getUserOrganizations: wrapEndpointREST(
            getUserOrganizations,
            getBaseContext(connection)
        ),
        organizationExists: wrapEndpointREST(
            organizationExists,
            getBaseContext(connection)
        ),
        updateOrganization: wrapEndpointREST(
            updateOrganization,
            getBaseContext(connection)
        ),
        getOrganization: wrapEndpointREST(
            getOrganization,
            getBaseContext(connection)
        ),
    };

    app.post('/organizations/addOrganization', endpoints.addOrganization);
    app.post('/organizations/deleteOrganization', endpoints.deleteOrganization);
    app.post('/organizations/getOrganizations', endpoints.getUserOrganizations);
    app.post('/organizations/organizationExists', endpoints.organizationExists);
    app.post('/organizations/updateOrganization', endpoints.updateOrganization);
    app.post('/organizations/getOrganization', endpoints.getOrganization);
}
