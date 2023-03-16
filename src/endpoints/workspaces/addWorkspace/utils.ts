import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
  IAgent,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {newWorkspaceResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';

export const DEFAULT_ADMIN_PERMISSION_GROUP_NAME = 'Admin';
export const DEFAULT_PUBLIC_PERMISSION_GROUP_NAME = 'Public';
export const DEFAULT_COLLABORATOR_PERMISSION_GROUP_NAME = 'Collaborator';

function makeAdminPermissions(
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

function makeCollaboratorPermissions(
  agent: IAgent,
  workspace: IWorkspace,
  permissiongroup: IPermissionGroup
) {
  function makePermission(
    actions: BasicCRUDActions[],
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
    makePermission([BasicCRUDActions.Read], AppResourceType.Workspace, workspace.resourceId)
  );
  permissionItems = permissionItems.concat(
    makePermission([BasicCRUDActions.Read], AppResourceType.AgentToken, undefined)
  );
  permissionItems = permissionItems.concat(
    makePermission(
      [BasicCRUDActions.Create, BasicCRUDActions.Update, BasicCRUDActions.Read],
      AppResourceType.Folder,
      undefined
    )
  );
  permissionItems = permissionItems.concat(
    makePermission(
      [BasicCRUDActions.Create, BasicCRUDActions.Update, BasicCRUDActions.Read],
      AppResourceType.File,
      undefined
    )
  );
  permissionItems = permissionItems.concat(
    makePermission([BasicCRUDActions.Read], AppResourceType.User, undefined)
  );

  return permissionItems;
}

export async function setupDefaultWorkspacePermissionGroups(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace
) {
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
  await context.semantic.permissionGroup.insertItem([
    adminPermissionGroup,
    publicPermissionGroup,
    collaboratorPermissionGroup,
  ]);

  const permissionItems = makeAdminPermissions(agent, workspace, adminPermissionGroup).concat(
    makeCollaboratorPermissions(agent, workspace, collaboratorPermissionGroup)
  );
  await context.semantic.permissionItem.insertItem(permissionItems);
  return {
    adminPermissionGroup,
    publicPermissionGroup,
    collaboratorPermissionGroup,
  };
}

export async function addWorkspaceToUserAndAssignAdminPermissionGroup(
  context: IBaseContext,
  agent: IAgent,
  user: IUser,
  workspace: IWorkspace,
  adminPermissionGroup: IPermissionGroup
) {
  await Promise.all([
    // Assign workspace to user
    assignWorkspaceToUser(context, agent, workspace.resourceId, user),

    // Assign admin permission group to user
    addAssignedPermissionGroupList(
      context,
      agent,
      workspace.resourceId,
      [{permissionGroupId: adminPermissionGroup.resourceId}],
      user.resourceId,
      /** deleteExisting */ false,
      /** skipPermissionGroupsExistCheck */ true
    ),
  ]);

  return await populateUserWorkspaces(context, user);
}
