import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {GetResourcesEndpoint} from './getResources/types.js';

export interface FetchResourceItem {
  resourceId?: string | string[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
  // TODO: make action optional and default read action for resource
  action: FimidaraPermissionAction;
}

export type GetResourcesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetResourcesEndpoint>;

export type ResourcesExportedEndpoints = {
  getResources: GetResourcesHttpEndpoint;
};
