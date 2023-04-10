import {IPublicPermissionItem} from '../../../definitions/permissionItem';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';
import {IPermissionItemInputTarget} from '../types';

export interface IGetResourcePermissionItemsEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {
  target: IPermissionItemInputTarget;
}

export interface IGetResourcePermissionItemsEndpointParams
  extends IEndpointOptionalWorkspaceIDParam {
  target: IPermissionItemInputTarget;
}

export interface IGetResourcePermissionItemsEndpointResult {
  items: IPublicPermissionItem[];
}

export type GetResourcePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetResourcePermissionItemsEndpointParams,
  IGetResourcePermissionItemsEndpointResult
>;
