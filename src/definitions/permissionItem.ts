import {
  AppActionType,
  AppResourceType,
  ConvertAgentToPublicAgent,
  WorkspaceResource,
} from './system';

export enum PermissionItemAppliesTo {
  Self = 'self',
  SelfAndChildrenOfType = 'selfAndChildren',
  ChildrenOfType = 'children',
}

export interface PermissionItem extends WorkspaceResource {
  /**
   * One of user, client token, program token, or permission group. It's the
   * entity this permission item was created for.
   */
  entityId: string;
  entityType: AppResourceType;
  targetParentId: string;
  targetParentType: AppResourceType;
  targetId: string;
  targetType: AppResourceType;
  appliesTo: PermissionItemAppliesTo;
  grantAccess: boolean;
  action: AppActionType;
}

export type PublicPermissionItem = ConvertAgentToPublicAgent<PermissionItem>;
