import {Connection} from 'mongoose';
import {Express} from 'express';
import addPresetPermissionsItems from './addItem/handler';
import deletePresetPermissionsItem from './deleteItem/handler';
import getPresetPermissionsItem from './getItem/handler';
import getOrganizationPresetPermissionsItem from './getOrganizationItems/handler';
import updatePresetPermissionsItem from './updateItem/handler';
import {wrapEndpointREST} from '../utils';

export default function setupPresetPermissionsItemRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addPresetPermissionsItems: wrapEndpointREST(
      addPresetPermissionsItems,
      getBaseContext(connection)
    ),
    deletePresetPermissionsItem: wrapEndpointREST(
      deletePresetPermissionsItem,
      getBaseContext(connection)
    ),
    getPresetPermissionsItem: wrapEndpointREST(
      getPresetPermissionsItem,
      getBaseContext(connection)
    ),
    getOrganizationPresetPermissionsItem: wrapEndpointREST(
      getOrganizationPresetPermissionsItem,
      getBaseContext(connection)
    ),
    updatePresetPermissionsItem: wrapEndpointREST(
      updatePresetPermissionsItem,
      getBaseContext(connection)
    ),
  };

  app.post(
    '/presetPermissionsGroups/addItems',
    endpoints.addPresetPermissionsItems
  );
  app.post(
    '/presetPermissionsGroups/deleteItem',
    endpoints.deletePresetPermissionsItem
  );
  app.post(
    '/presetPermissionsGroups/getOrganizationItems',
    endpoints.getOrganizationPresetPermissionsItem
  );
  app.post(
    '/presetPermissionsGroups/getItem',
    endpoints.getPresetPermissionsItem
  );
  app.post(
    '/presetPermissionsGroups/updateItem',
    endpoints.updatePresetPermissionsItem
  );
}
