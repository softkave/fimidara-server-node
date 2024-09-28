import {kEndpointTag} from '../types.js';
import countWorkspaceSummedUsage from './countWorkspaceSummedUsage/handler.js';
import {
  countWorkspaceSummedUsageEndpointDefinition,
  getUsageCostsEndpointDefinition,
  getWorkspaceSummedUsageEndpointDefinition,
} from './endpoints.mddoc.js';
import getUsageCosts from './getUsageCosts/handler.js';
import getWorkspaceSummedUsage from './getWorkspaceSummedUsage/handler.js';
import {UsageRecordsExportedEndpoints} from './types.js';

export function getUsageRecordsHttpEndpoints() {
  const usageRecordsExportedEndpoints: UsageRecordsExportedEndpoints = {
    getUsageCosts: {
      tag: [kEndpointTag.public],
      fn: getUsageCosts,
      mddocHttpDefinition: getUsageCostsEndpointDefinition,
    },
    getWorkspaceSummedUsage: {
      tag: [kEndpointTag.public],
      fn: getWorkspaceSummedUsage,
      mddocHttpDefinition: getWorkspaceSummedUsageEndpointDefinition,
    },
    countWorkspaceSummedUsage: {
      tag: [kEndpointTag.public],
      fn: countWorkspaceSummedUsage,
      mddocHttpDefinition: countWorkspaceSummedUsageEndpointDefinition,
    },
  };
  return usageRecordsExportedEndpoints;
}
