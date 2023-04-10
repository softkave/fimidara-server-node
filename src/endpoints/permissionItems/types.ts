import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {AppActionType, AppResourceType} from '../../definitions/system';

export interface IPermissionItemInputTarget {
  targetId: string | string[];
  targetType?: AppResourceType | AppResourceType[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
}

export interface IPermissionItemInputEntity {
  /** Must be user, permission group, or agent token IDs. */
  entityId: string | string[];
}

export interface IPermissionItemInput {
  target: IPermissionItemInputTarget | IPermissionItemInputTarget[];
  action: AppActionType | AppActionType[];
  grantAccess: boolean;
  appliesTo: PermissionItemAppliesTo;
  entity?: IPermissionItemInputEntity;
}
