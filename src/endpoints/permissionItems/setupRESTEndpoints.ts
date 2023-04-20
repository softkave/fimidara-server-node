import {Express} from 'express';
import {BaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addItems from './addItems/handler';
import {permissionItemConstants} from './constants';
import deletePermissionItems from './deleteItems/handler';
import {PermissionItemsExportedEndpoints} from './types';

export default function setupPermissionItemsRESTEndpoints(ctx: BaseContext, app: Express) {
  const endpoints: PermissionItemsExportedEndpoints = {
    addItems: wrapEndpointREST(addItems, ctx),
    deleteItems: wrapEndpointREST(deletePermissionItems, ctx),
  };

  app.post(permissionItemConstants.routes.addItems, endpoints.addItems);
  app.delete(permissionItemConstants.routes.deleteItems, endpoints.deleteItems);
}
