import countWorkspaceSummedUsage from './countWorkspaceSummedUsage/handler.js';
import {
  countWorkspaceSummedUsageEndpointDefinition,
  getUsageCostsEndpointDefinition,
  getWorkspaceSummedUsageEndpointDefinition,
} from './endpoints.mddoc.js';
import getUsageCosts from './getUsageCosts/handler.js';
import getWorkspaceSummedUsage from './getWorkspaceSummedUsage/handler.js';
import {UsageRecordsExportedEndpoints} from './types.js';

export function getUsageRecordsPublicHttpEndpoints() {
  const usageRecordsExportedEndpoints: UsageRecordsExportedEndpoints = {
    getUsageCosts: {
      fn: getUsageCosts,
      mddocHttpDefinition: getUsageCostsEndpointDefinition,
    },
    getWorkspaceSummedUsage: {
      fn: getWorkspaceSummedUsage,
      mddocHttpDefinition: getWorkspaceSummedUsageEndpointDefinition,
    },
    countWorkspaceSummedUsage: {
      fn: countWorkspaceSummedUsage,
      mddocHttpDefinition: countWorkspaceSummedUsageEndpointDefinition,
    },
  };
  return usageRecordsExportedEndpoints;
}
