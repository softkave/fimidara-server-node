import {PermissionAction} from '../../../definitions/permissionItem';
import {Endpoint} from '../../types';
import {PermissionItemInputTarget} from '../types';

export type DeletePermissionItemInputTarget = Partial<PermissionItemInputTarget>;
export type DeletePermissionItemInput = {
  target: DeletePermissionItemInputTarget | DeletePermissionItemInputTarget[];
  action?: PermissionAction | PermissionAction[];
  access?: boolean;
  entityId?: string | string[];
};

export interface DeletePermissionItemsEndpointParams {
  workspaceId?: string;
  items?: DeletePermissionItemInput[];
}

export interface DeletePermissionItemsEndpointResultJobItem {
  resourceId: string;
  jobId: string;
}

export interface DeletePermissionItemsEndpointResult {
  jobs: Array<DeletePermissionItemsEndpointResultJobItem>;
}

export type DeletePermissionItemsEndpoint = Endpoint<
  DeletePermissionItemsEndpointParams,
  DeletePermissionItemsEndpointResult
>;

export type DeletePermissionItemsCascadeFnsArgs = {
  workspaceId: string;
  permissionItemsIdList: string[];
};
