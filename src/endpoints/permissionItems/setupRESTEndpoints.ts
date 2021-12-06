import {Express} from 'express';
import addPermissionItems from './addItems/handler';
import deletePermissionItems from './deleteItems/handler';
import getPermissionEntityItems from './getPermissionEntityItems/handler';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupPermissionItemRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addPermissionItems: wrapEndpointREST(addPermissionItems, ctx),
    deletePermissionItems: wrapEndpointREST(deletePermissionItems, ctx),
    getPermissionEntityItems: wrapEndpointREST(getPermissionEntityItems, ctx),
  };

  app.post('/permissionItems/addPermissionItems', endpoints.addPermissionItems);
  app.post(
    '/permissionItems/deletePermissionItems',
    endpoints.deletePermissionItems
  );
  app.post(
    '/permissionItems/getPermissionEntityItems',
    endpoints.getPermissionEntityItems
  );
}
