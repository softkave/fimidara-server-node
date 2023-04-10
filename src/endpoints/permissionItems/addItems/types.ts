import {IPublicPermissionItem} from '../../../definitions/permissionItem';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';
import {IPermissionItemInput, IPermissionItemInputEntity} from '../types';

export interface IAddPermissionItemsEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  entity?: IPermissionItemInputEntity;
  items: IPermissionItemInput[];
}

export interface IAddPermissionItemsEndpointResult {
  items: IPublicPermissionItem[];
}

export type AddPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IAddPermissionItemsEndpointParams,
  IAddPermissionItemsEndpointResult
>;
