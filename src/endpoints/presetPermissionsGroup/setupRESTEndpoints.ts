import {Express} from 'express';
import addPresetPermissionsGroup from './addPreset/handler';
import deletePresetPermissionsItem from './deletePreset/handler';
import getPresetPermissionsItem from './getPreset/handler';
import getOrganizationPresetPermissionsItem from './getOrganizationPresets/handler';
import updatePresetPermissionsItem from './updatePreset/handler';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupPresetPermissionsItemRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addPresetPermissionsItems: wrapEndpointREST(addPresetPermissionsGroup, ctx),
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
