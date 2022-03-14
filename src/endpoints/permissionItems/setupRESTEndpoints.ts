import {Express} from 'express';
import addPermissionItems from './addItems/handler';
import deletePermissionItems from './deleteItems/handler';
import getEntityPermissionItems from './getEntityPermissionItems/handler';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupPermissionItemsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addPermissionItems: wrapEndpointREST(addPermissionItems, ctx),
    deletePermissionItems: wrapEndpointREST(deletePermissionItems, ctx),
    getEntityPermissionItems: wrapEndpointREST(getEntityPermissionItems, ctx),
  };

  app.post('/permissionItems/addPermissionItems', endpoints.addPermissionItems);
  app.post(
    '/permissionItems/deletePermissionItems',
    endpoints.deletePermissionItems
  );
  app.post(
    '/permissionItems/getEntityPermissionItems',
    endpoints.getEntityPermissionItems
  );
}
