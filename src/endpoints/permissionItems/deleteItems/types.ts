import {FimidaraPermissionAction} from '../../../definitions/permissionItem.js';
import {MultipleLongRunningJobResult} from '../../jobs/types.js';
import {Endpoint} from '../../types.js';
import {PermissionItemInputTarget} from '../types.js';

export type DeletePermissionItemInputTarget =
  Partial<PermissionItemInputTarget>;
export interface DeletePermissionItemInput
  extends DeletePermissionItemInputTarget {
  action?: FimidaraPermissionAction | FimidaraPermissionAction[];
  access?: boolean;
  entityId?: string | string[];
}

export interface DeletePermissionItemsEndpointParams {
  workspaceId?: string;
  items: DeletePermissionItemInput[];
}

export type DeletePermissionItemsEndpoint = Endpoint<
  DeletePermissionItemsEndpointParams,
  MultipleLongRunningJobResult
>;

export type DeletePermissionItemsCascadeFnsArgs = {
  workspaceId: string;
  permissionItemsIdList: string[];
};
