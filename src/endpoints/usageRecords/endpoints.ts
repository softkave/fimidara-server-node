import countWorkspaceSummedUsage from './countWorkspaceSummedUsage/handler';
import {
  countWorkspaceSummedUsageEndpointDefinition,
  getUsageCostsEndpointDefinition,
  getWorkspaceSummedUsageEndpointDefinition,
} from './endpoints.mddoc';
import getUsageCosts from './getUsageCosts/handler';
import getWorkspaceSummedUsage from './getWorkspaceSummedUsage/handler';
import {UsageRecordsExportedEndpoints} from './types';

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
