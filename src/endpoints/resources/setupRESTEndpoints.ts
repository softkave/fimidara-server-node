import {Express} from 'express';
import {BaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import resourcesConstants from './constants';
import getResources from './getResources/handler';
import {ResourcesExportedEndpoints} from './types';

export default function setupResourcesRESTEndpoints(ctx: BaseContext, app: Express) {
  const endpoints: ResourcesExportedEndpoints = {
    getResources: wrapEndpointREST(getResources, ctx),
  };

  app.post(resourcesConstants.routes.getResources, endpoints.getResources);
}
