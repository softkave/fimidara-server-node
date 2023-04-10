import {
  AppActionType,
  AppResourceType,
  ConvertAgentToPublicAgent,
  IWorkspaceResource,
} from './system';

export enum PermissionItemAppliesTo {
  Self = 'self',
  SelfAndChildrenOfType = 'selfAndChildrenOfType',
  ChildrenOfType = 'childrenOfType',
}

export interface IPermissionItem extends IWorkspaceResource {
  /**
   * One of user, client token, program token, or permission group. It's the
   * entity this permission item was created for.
   */
  entityId: string;
  entityType: AppResourceType;
  targetId: string;
  targetType: AppResourceType;
  appliesTo: PermissionItemAppliesTo;
  grantAccess: boolean;
  action: AppActionType;
}

export type IPublicPermissionItem = ConvertAgentToPublicAgent<IPermissionItem>;
