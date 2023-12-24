import {PermissionGroup} from '../../../definitions/permissionGroups';
import {
  PermissionAction,
  PermissionItem,
  kPermissionsMap,
} from '../../../definitions/permissionItem';
import {Agent, AppResourceType, kAppResourceType} from '../../../definitions/system';
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
  const permissionItems: PermissionItem[] = Object.values(kPermissionsMap).map(action => {
    const item: PermissionItem = newWorkspaceResource(
      agent,
      kAppResourceType.PermissionItem,
      workspace.resourceId,
      {
        action,
        entityId: adminPermissionGroup.resourceId,
        entityType: kAppResourceType.PermissionGroup,
        targetParentId: workspace.resourceId,
        targetId: workspace.resourceId,
        targetType: kAppResourceType.All,
        access: true,
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
    actions: PermissionAction[],
    targetType: AppResourceType,
    targetId: string
  ) {
    return actions.map(action => {
      const item: PermissionItem = newWorkspaceResource(
        agent,
        kAppResourceType.PermissionItem,
        workspace.resourceId,
        {
          action,
          targetId,
          targetParentId: workspace.resourceId,
          targetType: targetType,
          entityId: permissiongroup.resourceId,
          entityType: kAppResourceType.PermissionGroup,
          access: true,
        }
      );
      return item;
    });
  }

  const actions: PermissionAction[] = [
    kPermissionsMap.updateWorkspace,
    kPermissionsMap.readWorkspace,
    kPermissionsMap.addFolder,
    kPermissionsMap.readFolder,
    kPermissionsMap.updateFolder,
    kPermissionsMap.transferFolder,
    kPermissionsMap.addFile,
    kPermissionsMap.readFile,
    kPermissionsMap.transferFile,
    kPermissionsMap.addAgentToken,
    kPermissionsMap.readAgentToken,
    kPermissionsMap.updateAgentToken,
  ];

  const permissionItems: PermissionItem[] = makePermission(
    actions,
    kAppResourceType.Workspace,
    workspace.resourceId
  );

  return permissionItems;
}

export function generateDefaultWorkspacePermissionGroups(
  agent: Agent,
  workspace: Workspace
) {
  const createdAt = getTimestamp();
  const adminPermissionGroup: PermissionGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewIdForResource(kAppResourceType.PermissionGroup),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
    description:
      'Auto-generated permission group with access to every resource in this workspace.',
  };
  const publicPermissionGroup: PermissionGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewIdForResource(kAppResourceType.PermissionGroup),
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
    resourceId: getNewIdForResource(kAppResourceType.PermissionGroup),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_COLLABORATOR_PERMISSION_GROUP_NAME,
    description:
      'Auto-generated permission group for collaborators. Open permission group to see permissions.',
  };
  const permissionItems = generateAdminPermissions(
    agent,
    workspace,
    adminPermissionGroup
  ).concat(
    generateCollaboratorPermissions(agent, workspace, collaboratorPermissionGroup)
  );
  return {
    adminPermissionGroup,
    publicPermissionGroup,
    collaboratorPermissionGroup,
    permissionItems,
  };
}
