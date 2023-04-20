import {Express} from 'express';
import {BaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import clientLogsConstants from './constants';
import ingestLogs from './ingestLogs/handler';
import {ClientLogsExportedEndpoints} from './types';

export default function setupResourcesRESTEndpoints(ctx: BaseContext, app: Express) {
  const endpoints: ClientLogsExportedEndpoints = {
    ingestLogs: wrapEndpointREST(ingestLogs, ctx),
  };

  app.post(clientLogsConstants.routes.ingestLogs, endpoints.ingestLogs);
}
