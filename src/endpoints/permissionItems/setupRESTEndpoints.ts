import {Connection} from 'mongoose';
import {Express} from 'express';
import addPermissionItems from './addItems/handler';
import deletePermissionItems from './deleteItems/handler';
import getPermissionEntityItems from './getPermissionEntityItems/handler';

export default function setupPermissionItemRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addPermissionItems: wrapEndpointREST(
      addPermissionItems,
      getBaseContext(connection)
    ),
    deletePermissionItems: wrapEndpointREST(
      deletePermissionItems,
      getBaseContext(connection)
    ),
    getPermissionEntityItems: wrapEndpointREST(
      getPermissionEntityItems,
      getBaseContext(connection)
    ),
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
