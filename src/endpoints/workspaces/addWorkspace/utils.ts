import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  getWorkspaceActionList,
  IAgent,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {newWorkspaceResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';

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
        entityId: adminPermissionGroup.resourceId,
        entityType: AppResourceType.PermissionGroup,
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
  agent: IAgent,
  workspace: IWorkspace,
  permissiongroup: IPermissionGroup
) {
  function makePermission(
    actions: AppActionType[],
    targetType: AppResourceType,
    targetId: string,
    appliesTo: PermissionItemAppliesTo
  ) {
    return actions.map(action => {
      const item: IPermissionItem = newWorkspaceResource(
        agent,
        AppResourceType.PermissionItem,
        workspace.resourceId,
        {
          action,
          targetId,
          appliesTo,
          targetType: targetType,
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
    makePermission(
      [AppActionType.Read],
      AppResourceType.Workspace,
      workspace.resourceId,
      PermissionItemAppliesTo.Self
    )
  );
  permissionItems = permissionItems.concat(
    makePermission(
      [AppActionType.Read],
      AppResourceType.AgentToken,
      workspace.resourceId,
      PermissionItemAppliesTo.ChildrenOfType
    )
  );
  permissionItems = permissionItems.concat(
    makePermission(
      [AppActionType.Create, AppActionType.Update, AppActionType.Read],
      AppResourceType.Folder,
      workspace.resourceId,
      PermissionItemAppliesTo.ChildrenOfType
    )
  );
  permissionItems = permissionItems.concat(
    makePermission(
      [AppActionType.Create, AppActionType.Update, AppActionType.Read],
      AppResourceType.File,
      workspace.resourceId,
      PermissionItemAppliesTo.ChildrenOfType
    )
  );
  permissionItems = permissionItems.concat(
    makePermission(
      [AppActionType.Read],
      AppResourceType.User,
      workspace.resourceId,
      PermissionItemAppliesTo.ChildrenOfType
    )
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
