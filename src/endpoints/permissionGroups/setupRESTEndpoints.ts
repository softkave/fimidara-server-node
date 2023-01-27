import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addPermissionGroup from './addPermissionGroup/handler';
import deletePermissionGroupPermissionsItem from './deletePermissionGroup/handler';
import getPermissionGroupPermissionsItem from './getPermissionGroup/handler';
import getWorkspacePermissionGroups from './getWorkspacePermissionGroups/handler';
import updatePermissionGroupPermissionsItem from './udpatePermissionGroup/handler';

export default function setupPermissionGroupsRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    addPermissionGroup: wrapEndpointREST(addPermissionGroup, ctx),
    deletePermissionGroup: wrapEndpointREST(deletePermissionGroupPermissionsItem, ctx),
    getPermissionGroup: wrapEndpointREST(getPermissionGroupPermissionsItem, ctx),
    getWorkspacePermissionGroups: wrapEndpointREST(getWorkspacePermissionGroups, ctx),
    updatePermissionGroup: wrapEndpointREST(updatePermissionGroupPermissionsItem, ctx),
  };

  app.post('/permissionGroups/addPermissionGroup', endpoints.addPermissionGroup);
  app.delete('/permissionGroups/deletePermissionGroup', endpoints.deletePermissionGroup);
  app.post('/permissionGroups/getWorkspacePermissionGroups', endpoints.getWorkspacePermissionGroups);
  app.post('/permissionGroups/getPermissionGroup', endpoints.getPermissionGroup);
  app.post('/permissionGroups/updatePermissionGroup', endpoints.updatePermissionGroup);
}
