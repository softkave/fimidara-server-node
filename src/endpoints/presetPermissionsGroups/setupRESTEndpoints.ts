import {Express} from 'express';
import addPresetPermissionsGroup from './addPreset/handler';
import deletePresetPermissionsItem from './deletePreset/handler';
import getPresetPermissionsItem from './getPreset/handler';
import getOrganizationPresetPermissionsItem from './getOrganizationPresets/handler';
import updatePresetPermissionsItem from './updatePreset/handler';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupPresetPermissionsGroupsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addPreset: wrapEndpointREST(addPresetPermissionsGroup, ctx),
    deletePreset: wrapEndpointREST(deletePresetPermissionsItem, ctx),
    getPreset: wrapEndpointREST(getPresetPermissionsItem, ctx),
    getOrganizationPresets: wrapEndpointREST(
      getOrganizationPresetPermissionsItem,
      ctx
    ),
    updatePreset: wrapEndpointREST(updatePresetPermissionsItem, ctx),
  };

  app.post('/presetPermissionsGroups/addPreset', endpoints.addPreset);
  app.post('/presetPermissionsGroups/deletePreset', endpoints.deletePreset);
  app.post(
    '/presetPermissionsGroups/getOrganizationPresets',
    endpoints.getOrganizationPresets
  );
  app.post('/presetPermissionsGroups/getPreset', endpoints.getPreset);
  app.post('/presetPermissionsGroups/updatePreset', endpoints.updatePreset);
}
