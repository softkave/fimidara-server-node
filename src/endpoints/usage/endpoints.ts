import {kEndpointTag} from '../types.js';
import countWorkspaceSummedUsage from './countSummedUsage/handler.js';
import {
  countWorkspaceSummedUsageEndpointDefinition,
  getUsageCostsEndpointDefinition,
  getWorkspaceSummedUsageEndpointDefinition,
} from './endpoints.mddoc.js';
import getWorkspaceSummedUsage from './getSummedUsage/handler.js';
import getUsageCosts from './getUsageCosts/handler.js';
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
