import {
  getUsageCostsEndpointDefinition,
  getWorkspaceSummedUsageEndpointDefinition,
} from './endpoints.mddoc';
import getUsageCosts from './getUsageCosts/handler';
import getWorkspaceSummedUsage from './getWorkspaceSummedUsage/handler';
import {UsageRecordsExportedEndpoints} from './types';

export const usageRecordsExportedEndpoints: UsageRecordsExportedEndpoints = {
  getUsageCosts: {
    fn: getUsageCosts,
    mddocHttpDefinition: getUsageCostsEndpointDefinition,
  },
  getWorkspaceSummedUsage: {
    fn: getWorkspaceSummedUsage,
    mddocHttpDefinition: getWorkspaceSummedUsageEndpointDefinition,
  },
};
