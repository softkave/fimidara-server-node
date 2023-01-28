import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import resourcesConstants from './constants';
import getResources from './getResources/handler';

export default function setupResourcesRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    getResources: wrapEndpointREST(getResources, ctx),
  };

  app.post(resourcesConstants.routes.getResources, endpoints.getResources);
}
