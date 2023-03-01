import {IPublicPermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

// export interface IPermissionItemInputTarget {
//   targetId?: string | string[];
//   targetType?: AppResourceType | AppResourceType[];
//   filepath?: string | string[];
//   folderpath?: string | string[];
//   workspaceRootname?: string;
// }

// export interface IPermissionItemInputContainer {
//   /** Must be workspace or folder IDs. */
//   containerId?: string | string[];
//   folderpath?: string | string[];
//   workspaceRootname?: string;
// }

// export interface INewPermissionItemInput {
//   target: IPermissionItemInputTarget | IPermissionItemInputTarget[];
//   containerId?: IPermissionItemInputContainer | IPermissionItemInputContainer[];
//   action: BasicCRUDActions | BasicCRUDActions[];
//   appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
//   grantAccess?: boolean;
// }

export interface INewPermissionItemInput {
  targetId?: string;
  targetType?: AppResourceType;
  grantAccess?: boolean;
  appliesTo?: PermissionItemAppliesTo;
  action: BasicCRUDActions;
}

export interface IAddPermissionItemsEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  items: INewPermissionItemInput[];
  entityId: string | string[];
  containerId?: string;
}

export interface IAddPermissionItemsEndpointResult {
  items: IPublicPermissionItem[];
}

export type AddPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IAddPermissionItemsEndpointParams,
  IAddPermissionItemsEndpointResult
>;
