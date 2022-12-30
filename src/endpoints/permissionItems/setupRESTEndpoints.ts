import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addItems from './addItems/handler';
import deleteItemsById from './deleteItemsById/handler';
import getEntityPermissionItems from './getEntityPermissionItems/handler';
import getResourcePermissionItems from './getResourcePermissionItems/handler';
import replacePermissionItemsByEntity from './replaceItemsByEntity/handler';

export default function setupPermissionItemsRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    replacePermissionItemsByEntity: wrapEndpointREST(replacePermissionItemsByEntity, ctx),
    getEntityPermissionItems: wrapEndpointREST(getEntityPermissionItems, ctx),
    addItems: wrapEndpointREST(addItems, ctx),
    deleteItemsById: wrapEndpointREST(deleteItemsById, ctx),
    getResourcePermissionItems: wrapEndpointREST(getResourcePermissionItems, ctx),
  };

  app.post('/permissionItems/replaceItemsByEntity', endpoints.replacePermissionItemsByEntity);
  app.post('/permissionItems/getEntityPermissionItems', endpoints.getEntityPermissionItems);
  app.post('/permissionItems/addItems', endpoints.addItems);
  app.delete('/permissionItems/deleteItemsById', endpoints.deleteItemsById);
  app.post('/permissionItems/getResourcePermissionItems', endpoints.getResourcePermissionItems);
}
