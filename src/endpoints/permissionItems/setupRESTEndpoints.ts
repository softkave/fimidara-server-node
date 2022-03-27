import {Express} from 'express';
import replacePermissionItemsByEntity from './replaceItemsByEntity/handler';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';
import getEntityPermissionItems from './getEntityPermissionItems/handler';
import replacePermissionItemsByResource from './replaceItemsByResource/handler';
import getResourcePermissionItems from './getResourcePermissionItems/handler';

export default function setupPermissionItemsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    replacePermissionItemsByEntity: wrapEndpointREST(
      replacePermissionItemsByEntity,
      ctx
    ),

    getEntityPermissionItems: wrapEndpointREST(getEntityPermissionItems, ctx),
    replacePermissionItemsByResource: wrapEndpointREST(
      replacePermissionItemsByResource,
      ctx
    ),

    getResourcePermissionItems: wrapEndpointREST(
      getResourcePermissionItems,
      ctx
    ),
  };

  app.post(
    '/permissionItems/replaceItemsByEntity',
    endpoints.replacePermissionItemsByEntity
  );

  app.post(
    '/permissionItems/getEntityPermissionItems',
    endpoints.getEntityPermissionItems
  );

  app.post(
    '/permissionItems/replaceItemsByResource',
    endpoints.replacePermissionItemsByResource
  );

  app.post(
    '/permissionItems/getResourcePermissionItems',
    endpoints.getResourcePermissionItems
  );
}
