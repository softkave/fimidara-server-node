import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType} from '../../../definitions/system';
import {BaseContext} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';
import {PermissionItemInputEntity, PermissionItemInputTarget} from '../types';

export type DeletePermissionItemInput = {
  target: Partial<PermissionItemInputTarget> | Partial<PermissionItemInputTarget>[];
  action?: AppActionType | AppActionType[];
  grantAccess?: boolean;
  appliesTo?: PermissionItemAppliesTo;
  entity?: PermissionItemInputEntity;
};

export interface DeletePermissionItemsEndpointParams {
  workspaceId?: string;
  entity?: PermissionItemInputEntity;
  items?: DeletePermissionItemInput[];
}

export type DeletePermissionItemsEndpoint = Endpoint<
  BaseContext,
  DeletePermissionItemsEndpointParams,
  LongRunningJobResult
>;

export type DeletePermissionItemsCascadeFnsArgs = {
  workspaceId: string;
  permissionItemsIdList: string[];
};
