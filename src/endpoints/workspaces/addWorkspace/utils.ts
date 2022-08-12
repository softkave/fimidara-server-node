import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {
  IPermissionItem,
  PermissionItemAppliesTo,
} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
  IAgent,
  SessionAgentType,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {getDateString} from '../../../utilities/dateFns';
import {getNewIdForResource} from '../../../utilities/resourceId';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {permissionItemIndexer} from '../../permissionItems/utils';

export const DEFAULT_ADMIN_PERMISSION_GROUP_NAME = 'Admin';
export const DEFAULT_PUBLIC_PERMISSION_GROUP_NAME = 'Public';
export const DEFAULT_COLLABORATOR_PERMISSION_GROUP_NAME = 'Collaborator';

function makeAdminPermissions(
  agent: IAgent,
  workspace: IWorkspace,
  adminPermissionGroup: IPermissionGroup
) {
  const permissionItems: IPermissionItem[] = getWorkspaceActionList().map(
    action => {
      const item: IPermissionItem = {
        action,
        resourceId: getNewIdForResource(AppResourceType.PermissionItem),
        workspaceId: workspace.resourceId,
        createdAt: getDateString(),
        createdBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
        permissionOwnerId: workspace.resourceId,
        permissionOwnerType: AppResourceType.Workspace,
        permissionEntityId: adminPermissionGroup.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        itemResourceType: AppResourceType.All,
        hash: '',
        appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
        grantAccess: true,
      };

      item.hash = permissionItemIndexer(item);
      return item;
    }
  );

  return permissionItems;
}

function makeCollaboratorPermissions(
  agent: IAgent,
  workspace: IWorkspace,
  permissiongroup: IPermissionGroup
) {
  function makePermission(
    actions: BasicCRUDActions[],
    itemResourceType: AppResourceType,
    itemResourceId?: string,
    appliesTo: PermissionItemAppliesTo = PermissionItemAppliesTo.OwnerAndChildren
  ) {
    return actions.map(action => {
      const item: IPermissionItem = {
        itemResourceType,
        action,
        itemResourceId,
        appliesTo,
        resourceId: getNewIdForResource(AppResourceType.PermissionItem),
        workspaceId: workspace.resourceId,
        createdAt: getDateString(),
        createdBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
        permissionOwnerId: workspace.resourceId,
        permissionOwnerType: AppResourceType.Workspace,
        permissionEntityId: permissiongroup.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        hash: '',
        grantAccess: true,
      };

      item.hash = permissionItemIndexer(item);
      return item;
    });
  }

  let permissionItems: IPermissionItem[] = [];
  permissionItems = permissionItems.concat(
    makePermission(
      [BasicCRUDActions.Read],
      AppResourceType.Workspace,
      workspace.resourceId
    )
  );

  permissionItems = permissionItems.concat(
    makePermission(
      [BasicCRUDActions.Read],
      AppResourceType.ProgramAccessToken,
      undefined,
      PermissionItemAppliesTo.OwnerAndChildren
    )
  );

  permissionItems = permissionItems.concat(
    makePermission(
      [BasicCRUDActions.Read],
      AppResourceType.ClientAssignedToken,
      undefined,
      PermissionItemAppliesTo.OwnerAndChildren
    )
  );

  permissionItems = permissionItems.concat(
    makePermission(
      [BasicCRUDActions.Create, BasicCRUDActions.Update, BasicCRUDActions.Read],
      AppResourceType.Folder,
      undefined,
      PermissionItemAppliesTo.OwnerAndChildren
    )
  );

  permissionItems = permissionItems.concat(
    makePermission(
      [BasicCRUDActions.Create, BasicCRUDActions.Update, BasicCRUDActions.Read],
      AppResourceType.File,
      undefined,
      PermissionItemAppliesTo.OwnerAndChildren
    )
  );

  permissionItems = permissionItems.concat(
    makePermission(
      [BasicCRUDActions.Read],
      AppResourceType.User,
      undefined,
      PermissionItemAppliesTo.OwnerAndChildren
    )
  );

  return permissionItems;
}

export async function setupDefaultWorkspacePermissionGroups(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace
) {
  const createdAt = getDateString();
  const adminPermissionGroup: IPermissionGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewIdForResource(AppResourceType.PermissionGroup),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
    description:
      'Auto-generated permission group that can access and perform every and all actions on all resources',
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
      'Auto-generated permission group for accessing and performing public operations.',
  };

  const collaboratorPermissionGroup: IPermissionGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewIdForResource(AppResourceType.PermissionGroup),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_COLLABORATOR_PERMISSION_GROUP_NAME,
    description: 'Auto-generated permission group for collaborators.',
  };

  await context.data.permissiongroup.bulkSaveItems([
    adminPermissionGroup,
    publicPermissionGroup,
    collaboratorPermissionGroup,
  ]);

  const permissionItems: IPermissionItem[] = makeAdminPermissions(
    agent,
    workspace,
    adminPermissionGroup
  ).concat(
    makeCollaboratorPermissions(agent, workspace, collaboratorPermissionGroup)
  );
  await context.data.permissionItem.bulkSaveItems(permissionItems);
  return {
    adminPermissionGroup,
    publicPermissionGroup,
    collaboratorPermissionGroup,
  };
}

export async function addWorkspaceToUserAndAssignAdminPermissionGroup(
  context: IBaseContext,
  user: IUser,
  workspace: IWorkspace,
  adminPermissionGroup: IPermissionGroup
) {
  const agent: IAgent = {
    agentId: user.resourceId,
    agentType: SessionAgentType.User,
  };

  await Promise.all([
    // Assign workspace to user
    assignWorkspaceToUser(context, agent, workspace.resourceId, user),

    // Assign admin permission group to user
    addAssignedPermissionGroupList(
      context,
      agent,
      workspace,
      [{permissionGroupId: adminPermissionGroup.resourceId, order: 0}],
      user.resourceId,
      AppResourceType.User,
      /** deleteExisting */ false,
      /** skipPermissionGroupsCheck */ true
    ),
  ]);

  return await populateUserWorkspaces(context, user);
}
