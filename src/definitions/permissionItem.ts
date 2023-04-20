import {
  AppActionType,
  AppResourceType,
  ConvertAgentToPublicAgent,
  WorkspaceResource,
} from './system';

export enum PermissionItemAppliesTo {
  Self = 's',
  SelfAndChildrenOfType = 'sc',
  ChildrenOfType = 'c',
}

export interface PermissionItem extends WorkspaceResource {
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

export type PublicPermissionItem = ConvertAgentToPublicAgent<PermissionItem>;
