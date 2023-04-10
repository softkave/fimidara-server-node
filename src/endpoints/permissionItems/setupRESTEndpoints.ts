import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addItems from './addItems/handler';
import {permissionItemConstants} from './constants';
import deletePermissionItems from './deleteItems/handler';

export default function setupPermissionItemsRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    addItems: wrapEndpointREST(addItems, ctx),
    deleteItems: wrapEndpointREST(deletePermissionItems, ctx),
  };

  app.post(permissionItemConstants.routes.addItems, endpoints.addItems);
  app.delete(permissionItemConstants.routes.deleteItems, endpoints.deleteItems);
}
