import {Express} from 'express';
import {BaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import {usageRecordConstants} from './constants';
import getUsageCosts from './getUsageCosts/handler';
import getWorkspaceSummedUsage from './getWorkspaceSummedUsage/handler';
import {UsageRecordsExportedEndpoints} from './types';

export default function setupUsageRecordsRESTEndpoints(ctx: BaseContext, app: Express) {
  const endpoints: UsageRecordsExportedEndpoints = {
    getUsageCosts: wrapEndpointREST(getUsageCosts, ctx),
    getWorkspaceSummedUsage: wrapEndpointREST(getWorkspaceSummedUsage, ctx),
  };

  app.post(usageRecordConstants.routes.getUsageCosts, endpoints.getUsageCosts);
  app.post(usageRecordConstants.routes.getWorkspaceSummedUsage, endpoints.getWorkspaceSummedUsage);
}
