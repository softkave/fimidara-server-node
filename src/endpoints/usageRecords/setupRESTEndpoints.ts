import {Express} from 'express';
import {IBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import getUsageCosts from './getUsageCosts/handler';
import getWorkspaceSummedUsage from './getWorkspaceSummedUsage/handler';

export default function setupUsageRecordsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    getUsageCosts: wrapEndpointREST(getUsageCosts, ctx),
    getWorkspaceSummedUsage: wrapEndpointREST(getWorkspaceSummedUsage, ctx),
  };

  app.post('/usageRecords/getUsageCosts', endpoints.getUsageCosts);
  app.post(
    '/usageRecords/getWorkspaceSummedUsage',
    endpoints.getWorkspaceSummedUsage
  );
}
