import {PermissionAction} from '../../definitions/permissionItem';
import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {GetResourcesEndpoint} from './getResources/types';

export interface FetchResourceItem {
  resourceId?: string | string[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
  action: PermissionAction;
}

export type GetResourcesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetResourcesEndpoint>;

export type ResourcesExportedEndpoints = {
  getResources: GetResourcesHttpEndpoint;
};
