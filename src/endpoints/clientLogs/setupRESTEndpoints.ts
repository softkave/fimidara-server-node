import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import ingestLogs from './ingestLogs/handler';

export default function setupResourcesRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    ingestLogs: wrapEndpointREST(ingestLogs, ctx),
  };

  app.post('/clientLogs/ingestLogs', endpoints.ingestLogs);
}
