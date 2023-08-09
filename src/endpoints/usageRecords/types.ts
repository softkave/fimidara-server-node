import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {CountWorkspaceSummedUsageEndpoint} from './countWorkspaceSummedUsage/types';
import {GetUsageCostsEndpoint} from './getUsageCosts/types';
import {GetWorkspaceSummedUsageEndpoint} from './getWorkspaceSummedUsage/types';

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
