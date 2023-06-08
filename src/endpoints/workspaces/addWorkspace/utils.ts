import {PermissionGroup} from '../../../definitions/permissionGroups';
import {PermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  Agent,
  AppActionType,
  AppResourceType,
  getWorkspaceActionList,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';

export const DEFAULT_ADMIN_PERMISSION_GROUP_NAME = 'Admin';
export const DEFAULT_PUBLIC_PERMISSION_GROUP_NAME = 'Public';
export const DEFAULT_COLLABORATOR_PERMISSION_GROUP_NAME = 'Collaborator';

function generateAdminPermissions(
  agent: Agent,
  workspace: Workspace,
  adminPermissionGroup: PermissionGroup
) {
  const permissionItems: PermissionItem[] = getWorkspaceActionList().map(action => {
    const item: PermissionItem = newWorkspaceResource(
      agent,
      AppResourceType.PermissionItem,
      workspace.resourceId,
      {
        action,
        entityId: adminPermissionGroup.resourceId,
        entityType: AppResourceType.PermissionGroup,
        targetParentId: workspace.resourceId,
        targetParentType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
        targetType: AppResourceType.All,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      }
    );
    return item;
  });

  return permissionItems;
}

function generateCollaboratorPermissions(
  agent: Agent,
  workspace: Workspace,
  permissiongroup: PermissionGroup
) {
  function makePermission(
    actions: AppActionType[],
    targetType: AppResourceType,
    targetId: string,
    appliesTo: PermissionItemAppliesTo
  ) {
    return actions.map(action => {
      const item: PermissionItem = newWorkspaceResource(
        agent,
        AppResourceType.PermissionItem,
        workspace.resourceId,
        {
          action,
          targetId,
          appliesTo,
          targetParentId: workspace.resourceId,
          targetParentType: AppResourceType.Workspace,
          targetType: targetType,
          entityId: permissiongroup.resourceId,
          entityType: AppResourceType.PermissionGroup,
          grantAccess: true,
        }
      );
      return item;
    });
  }

  let permissionItems: PermissionItem[] = makePermission(
    [AppActionType.Read],
    AppResourceType.Workspace,
    workspace.resourceId,
    PermissionItemAppliesTo.Self
  );

  const readResourceTypes: AppResourceType[] = [AppResourceType.AgentToken, AppResourceType.User];
  const createReadUpdateResourceTypes: AppResourceType[] = [
    AppResourceType.File,
    AppResourceType.Folder,
    AppResourceType.Tag,
  ];

  readResourceTypes.forEach(type => {
    permissionItems = permissionItems.concat(
      makePermission(
        [AppActionType.Read],
        type,
        workspace.resourceId,
        PermissionItemAppliesTo.ChildrenOfType
      )
    );
  });
  createReadUpdateResourceTypes.forEach(type => {
    permissionItems = permissionItems.concat(
      makePermission(
        [AppActionType.Create, AppActionType.Update, AppActionType.Read],
        type,
        workspace.resourceId,
        PermissionItemAppliesTo.ChildrenOfType
      )
    );
  });

  return permissionItems;
}

export function generateDefaultWorkspacePermissionGroups(agent: Agent, workspace: Workspace) {
  const createdAt = getTimestamp();
  const adminPermissionGroup: PermissionGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewIdForResource(AppResourceType.PermissionGroup),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
    description: 'Auto-generated permission group with access to every resource in this workspace.',
  };
  const publicPermissionGroup: PermissionGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewIdForResource(AppResourceType.PermissionGroup),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_PUBLIC_PERMISSION_GROUP_NAME,
    description:
      'Auto-generated permission group for public/anonymous users. ' +
      'Assign permissions to this group for resource/actions you want to be publicly accessible.',
  };
  const collaboratorPermissionGroup: PermissionGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewIdForResource(AppResourceType.PermissionGroup),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_COLLABORATOR_PERMISSION_GROUP_NAME,
    description:
      'Auto-generated permission group for collaborators. Open permission group to see permissions.',
  };
  const permissionItems = generateAdminPermissions(agent, workspace, adminPermissionGroup).concat(
    generateCollaboratorPermissions(agent, workspace, collaboratorPermissionGroup)
  );
  return {
    adminPermissionGroup,
    publicPermissionGroup,
    collaboratorPermissionGroup,
    permissionItems,
  };
}
