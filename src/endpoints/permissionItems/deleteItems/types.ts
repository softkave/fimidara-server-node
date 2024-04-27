import {FimidaraPermissionAction} from '../../../definitions/permissionItem';
import {MultipleLongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';
import {PermissionItemInputTarget} from '../types';

export type DeletePermissionItemInputTarget = Partial<PermissionItemInputTarget>;
export type DeletePermissionItemInput = {
  target?: DeletePermissionItemInputTarget | DeletePermissionItemInputTarget[];
  action?: FimidaraPermissionAction | FimidaraPermissionAction[];
  access?: boolean;
  entityId?: string | string[];
};

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
