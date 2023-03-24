import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  getWorkspaceActionList,
  IAgent,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {newWorkspaceResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';

export const DEFAULT_ADMIN_PERMISSION_GROUP_NAME = 'Admin';
export const DEFAULT_PUBLIC_PERMISSION_GROUP_NAME = 'Public';
export const DEFAULT_COLLABORATOR_PERMISSION_GROUP_NAME = 'Collaborator';

function generateAdminPermissions(
  agent: IAgent,
  workspace: IWorkspace,
  adminPermissionGroup: IPermissionGroup
) {
  const permissionItems: IPermissionItem[] = getWorkspaceActionList().map(action => {
    const item: IPermissionItem = newWorkspaceResource(
      agent,
      AppResourceType.PermissionItem,
      workspace.resourceId,
      {
        action,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
        entityId: adminPermissionGroup.resourceId,
        entityType: AppResourceType.PermissionGroup,
        targetType: AppResourceType.All,
        grantAccess: true,
      }
    );
    return item;
  });

  return permissionItems;
}

function generateCollaboratorPermissions(
  agent: IAgent,
  workspace: IWorkspace,
  permissiongroup: IPermissionGroup
) {
  function makePermission(
    actions: AppActionType[],
    targetType: AppResourceType,
    targetId?: string
  ) {
    return actions.map(action => {
      const item: IPermissionItem = newWorkspaceResource(
        agent,
        AppResourceType.PermissionItem,
        workspace.resourceId,
        {
          action,
          targetType: targetType,
          targetId: targetId,
          containerId: workspace.resourceId,
          containerType: AppResourceType.Workspace,
          entityId: permissiongroup.resourceId,
          entityType: AppResourceType.PermissionGroup,
          grantAccess: true,
        }
      );
      return item;
    });
  }

  let permissionItems: IPermissionItem[] = [];
  permissionItems = permissionItems.concat(
    makePermission([AppActionType.Read], AppResourceType.Workspace, workspace.resourceId)
  );
  permissionItems = permissionItems.concat(
    makePermission([AppActionType.Read], AppResourceType.AgentToken, undefined)
  );
  permissionItems = permissionItems.concat(
    makePermission(
      [AppActionType.Create, AppActionType.Update, AppActionType.Read],
      AppResourceType.Folder,
      undefined
    )
  );
  permissionItems = permissionItems.concat(
    makePermission(
      [AppActionType.Create, AppActionType.Update, AppActionType.Read],
      AppResourceType.File,
      undefined
    )
  );
  permissionItems = permissionItems.concat(
    makePermission([AppActionType.Read], AppResourceType.User, undefined)
  );

  return permissionItems;
}

export function generateDefaultWorkspacePermissionGroups(agent: IAgent, workspace: IWorkspace) {
  const createdAt = getTimestamp();
  const adminPermissionGroup: IPermissionGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewIdForResource(AppResourceType.PermissionGroup),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
    description: 'Auto-generated permission group with access to every resource in this workspace.',
  };
  const publicPermissionGroup: IPermissionGroup = {
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
  const collaboratorPermissionGroup: IPermissionGroup = {
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
