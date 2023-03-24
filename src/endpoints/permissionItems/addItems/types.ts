import {IPublicPermissionItem} from '../../../definitions/permissionItem';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';
import {
  IPermissionItemInput,
  IPermissionItemInputContainer,
  IPermissionItemInputEntity,
} from '../types';

export interface IAddPermissionItemsEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  entity?: IPermissionItemInputEntity;
  container?: IPermissionItemInputContainer;
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
