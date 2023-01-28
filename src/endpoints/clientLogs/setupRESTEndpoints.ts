import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import clientLogsConstants from './constants';
import ingestLogs from './ingestLogs/handler';

export default function setupResourcesRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    ingestLogs: wrapEndpointREST(ingestLogs, ctx),
  };

  app.post(clientLogsConstants.routes.ingestLogs, endpoints.ingestLogs);
}
