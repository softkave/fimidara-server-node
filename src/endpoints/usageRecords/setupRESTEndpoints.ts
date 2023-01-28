import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import {usageRecordConstants} from './constants';
import getUsageCosts from './getUsageCosts/handler';
import getWorkspaceSummedUsage from './getWorkspaceSummedUsage/handler';

export default function setupUsageRecordsRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    getUsageCosts: wrapEndpointREST(getUsageCosts, ctx),
    getWorkspaceSummedUsage: wrapEndpointREST(getWorkspaceSummedUsage, ctx),
  };

  app.post(usageRecordConstants.routes.getUsageCosts, endpoints.getUsageCosts);
  app.post(usageRecordConstants.routes.getWorkspaceSummedUsage, endpoints.getWorkspaceSummedUsage);
}
