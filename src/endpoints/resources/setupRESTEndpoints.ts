import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
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
