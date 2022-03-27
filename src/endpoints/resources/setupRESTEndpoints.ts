import {Express} from 'express';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';
import getResources from './getResources/handler';

export default function setupResourcesRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    getResources: wrapEndpointREST(getResources, ctx),
  };

  app.post('/resources/getResources', endpoints.getResources);
}
