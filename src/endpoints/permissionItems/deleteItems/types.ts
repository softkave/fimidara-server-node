import {PermissionAction} from '../../../definitions/permissionItem';
import {BaseContextType} from '../../contexts/types';
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

export type DeletePermissionItemsEndpoint = Endpoint<
  BaseContextType,
  DeletePermissionItemsEndpointParams,
  LongRunningJobResult
>;

export type DeletePermissionItemsCascadeFnsArgs = {
  workspaceId: string;
  permissionItemsIdList: string[];
};
