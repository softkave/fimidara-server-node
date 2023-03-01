import {AppResourceType, BasicCRUDActions, IWorkspaceResourceBase} from './system';

export enum PermissionItemAppliesTo {
  Container = 'container',
  ContainerAndChildren = 'containerAndChildren',
  Children = 'children',
}

export interface IPermissionItem extends IWorkspaceResourceBase {
  /**
   * Containers scope the reach of a permission item to either the container or
   * the resources contained within. One of workspace, or folder.
   */
  containerId: string;
  containerType: AppResourceType;

  /**
   * One of user, client token, program token, or permission group. It's the
   * entity this permission item was created for.
   */
  entityId: string;
  entityType: AppResourceType;
  targetId?: string;
  targetType: AppResourceType;
  action: BasicCRUDActions;
  grantAccess: boolean;
  appliesTo: PermissionItemAppliesTo;
}

export type IPublicPermissionItem = IPermissionItem;
