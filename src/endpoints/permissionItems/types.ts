import {AppActionType, AppResourceType} from '../../definitions/system';

export interface IPermissionItemInputTarget {
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
}

export interface IPermissionItemInputContainer {
  /** Must be workspace or folder IDs. */
  containerId?: string;
  folderpath?: string;
  workspaceRootname?: string;
  // TODO: add containerType
}

export interface IPermissionItemInputEntity {
  /** Must be user, permission group, or agent token IDs. */
  entityId: string | string[];
  // TODO: entityType
}

export interface IPermissionItemInput {
  target: IPermissionItemInputTarget | IPermissionItemInputTarget[];
  action: AppActionType | AppActionType[];
  grantAccess: boolean;
  container?: IPermissionItemInputContainer;
  entity?: IPermissionItemInputEntity;
}
