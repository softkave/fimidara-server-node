import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  GetResourcesEndpoint,
  GetResourcesEndpointParams,
  GetResourcesEndpointResult,
} from './getResources/types';

export interface FetchResourceItem {
  resourceId?: string | string[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
}

export type GetResourcesHttpEndpoint = HttpEndpoint<
  GetResourcesEndpoint,
  GetResourcesEndpointParams,
  GetResourcesEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type ResourcesExportedEndpoints = {
  getResources: ExportedHttpEndpointWithMddocDefinition<GetResourcesHttpEndpoint>;
};
