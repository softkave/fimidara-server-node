import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {ILongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';
import {IPermissionItemInputEntity, IPermissionItemInputTarget} from '../types';

export type DeletePermissionItemInput = {
  target: Partial<IPermissionItemInputTarget> | Partial<IPermissionItemInputTarget>[];
  action?: AppActionType | AppActionType[];
  grantAccess?: boolean;
  appliesTo?: PermissionItemAppliesTo;
  entity?: IPermissionItemInputEntity;
};

export interface IDeletePermissionItemsEndpointParams {
  workspaceId?: string;
  entity?: IPermissionItemInputEntity;
  items?: DeletePermissionItemInput[];
}

export type DeletePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsEndpointParams,
  ILongRunningJobResult
>;

export type DeletePermissionItemsCascadeFnsArgs = {
  workspaceId: string;
  permissionItemsIdList: string[];
};
