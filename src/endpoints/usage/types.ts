import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {CountWorkspaceSummedUsageEndpoint} from './countSummedUsage/types.js';
import {GetWorkspaceSummedUsageEndpoint} from './getSummedUsage/types.js';
import {GetUsageCostsEndpoint} from './getUsageCosts/types.js';

export type GetUsageCostsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetUsageCostsEndpoint>;
export type GetWorkspaceSummedUsageHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspaceSummedUsageEndpoint>;
export type CountWorkspaceSummedUsageHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountWorkspaceSummedUsageEndpoint>;

export type UsageRecordsExportedEndpoints = {
  getUsageCosts: GetUsageCostsHttpEndpoint;
  getWorkspaceSummedUsage: GetWorkspaceSummedUsageHttpEndpoint;
  countWorkspaceSummedUsage: CountWorkspaceSummedUsageHttpEndpoint;
};
