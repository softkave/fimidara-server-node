import {Express} from 'express';
import addPresetPermissionsItems from './addItem/handler';
import deletePresetPermissionsItem from './deleteItem/handler';
import getPresetPermissionsItem from './getItem/handler';
import getOrganizationPresetPermissionsItem from './getOrganizationItems/handler';
import updatePresetPermissionsItem from './updateItem/handler';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupPresetPermissionsItemRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addPresetPermissionsItems: wrapEndpointREST(addPresetPermissionsItems, ctx),
    deletePresetPermissionsItem: wrapEndpointREST(
      deletePresetPermissionsItem,
      ctx
    ),
    getPresetPermissionsItem: wrapEndpointREST(getPresetPermissionsItem, ctx),
    getOrganizationPresetPermissionsItem: wrapEndpointREST(
      getOrganizationPresetPermissionsItem,
      ctx
    ),
    updatePresetPermissionsItem: wrapEndpointREST(
      updatePresetPermissionsItem,
      ctx
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
