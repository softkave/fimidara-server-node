import {PermissionAction} from '../../../definitions/permissionItem';
import {LongRunningJobResult} from '../../jobs/types';
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

export interface DeletePermissionItemsEndpointResult {
  jobs: Array<{resourceId: string; jobId: string}>;
}

export type DeletePermissionItemsEndpoint = Endpoint<
  DeletePermissionItemsEndpointParams,
  LongRunningJobResult
>;

export type DeletePermissionItemsCascadeFnsArgs = {
  workspaceId: string;
  permissionItemsIdList: string[];
};
