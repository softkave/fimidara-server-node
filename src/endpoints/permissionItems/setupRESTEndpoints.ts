import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addItems from './addItems/handler';
import {permissionItemConstants} from './constants';
import deleteItemsById from './deleteItemsById/handler';
import getEntityPermissionItems from './getEntityPermissionItems/handler';
import getResourcePermissionItems from './getResourcePermissionItems/handler';

export default function setupPermissionItemsRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    getEntityPermissionItems: wrapEndpointREST(getEntityPermissionItems, ctx),
    addItems: wrapEndpointREST(addItems, ctx),
    deleteItemsById: wrapEndpointREST(deleteItemsById, ctx),
    getResourcePermissionItems: wrapEndpointREST(getResourcePermissionItems, ctx),
  };

  app.post(
    permissionItemConstants.routes.getEntityPermissionItems,
    endpoints.getEntityPermissionItems
  );
  app.post(permissionItemConstants.routes.addItems, endpoints.addItems);
  app.delete(permissionItemConstants.routes.deleteItemsById, endpoints.deleteItemsById);
  app.post(
    permissionItemConstants.routes.getResourcePermissionItems,
    endpoints.getResourcePermissionItems
  );
}
