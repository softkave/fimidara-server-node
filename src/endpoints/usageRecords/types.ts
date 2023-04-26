import {
  CountItemsEndpointResult,
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  CountWorkspaceSummedUsageEndpoint,
  CountWorkspaceSummedUsageEndpointParams,
} from './countWorkspaceSummedUsage/types';
import {
  GetUsageCostsEndpoint,
  GetUsageCostsEndpointParams,
  GetUsageCostsEndpointResult,
} from './getUsageCosts/types';
import {
  GetWorkspaceSummedUsageEndpoint,
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointResult,
} from './getWorkspaceSummedUsage/types';

export type GetUsageCostsHttpEndpoint = HttpEndpoint<
  GetUsageCostsEndpoint,
  GetUsageCostsEndpointParams,
  GetUsageCostsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspaceSummedUsageHttpEndpoint = HttpEndpoint<
  GetWorkspaceSummedUsageEndpoint,
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type CountWorkspaceSummedUsageHttpEndpoint = HttpEndpoint<
  CountWorkspaceSummedUsageEndpoint,
  CountWorkspaceSummedUsageEndpointParams,
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type UsageRecordsExportedEndpoints = {
  getUsageCosts: ExportedHttpEndpointWithMddocDefinition<GetUsageCostsHttpEndpoint>;
  getWorkspaceSummedUsage: ExportedHttpEndpointWithMddocDefinition<GetWorkspaceSummedUsageHttpEndpoint>;
  countWorkspaceSummedUsage: ExportedHttpEndpointWithMddocDefinition<CountWorkspaceSummedUsageHttpEndpoint>;
};
