import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType} from '../../../definitions/system';
import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';
import {PermissionItemInputEntity, PermissionItemInputTarget} from '../types';

export type DeletePermissionItemInputTarget = Partial<PermissionItemInputTarget>;
export type DeletePermissionItemInput = {
  target: DeletePermissionItemInputTarget | DeletePermissionItemInputTarget[];
  action?: AppActionType | AppActionType[];
  grantAccess?: boolean | boolean[];
  appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  entity?: PermissionItemInputEntity;
};

export interface DeletePermissionItemsEndpointParams {
  workspaceId?: string;
  entity?: PermissionItemInputEntity;
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
