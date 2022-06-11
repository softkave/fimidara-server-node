import {
  IPermissionItem,
  PermissionItemAppliesTo,
} from '../../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
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
import getNewId from '../../../utilities/getNewId';
import {
  addAssignedPresetList,
  addAssignedUserWorkspace,
} from '../../assignedItems/addAssignedItems';
import {withUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {permissionItemIndexer} from '../../permissionItems/utils';

export const DEFAULT_ADMIN_PRESET_NAME = 'Admin';
export const DEFAULT_PUBLIC_PRESET_NAME = 'Public';
export const DEFAULT_COLLABORATOR_PRESET_NAME = 'Collaborator';

function makeAdminPermissions(
  agent: IAgent,
  workspace: IWorkspace,
  adminPreset: IPresetPermissionsGroup
) {
  const permissionItems: IPermissionItem[] = getWorkspaceActionList().map(
    action => {
      const item: IPermissionItem = {
        action,
        resourceId: getNewId(),
        workspaceId: workspace.resourceId,
        createdAt: getDateString(),
        createdBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
        permissionOwnerId: workspace.resourceId,
        permissionOwnerType: AppResourceType.Workspace,
        permissionEntityId: adminPreset.resourceId,
        permissionEntityType: AppResourceType.PresetPermissionsGroup,
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
  preset: IPresetPermissionsGroup
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
        resourceId: getNewId(),
        workspaceId: workspace.resourceId,
        createdAt: getDateString(),
        createdBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
        permissionOwnerId: workspace.resourceId,
        permissionOwnerType: AppResourceType.Workspace,
        permissionEntityId: preset.resourceId,
        permissionEntityType: AppResourceType.PresetPermissionsGroup,
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

export async function setupDefaultWorkspacePresets(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace
) {
  const createdAt = getDateString();
  const adminPreset: IPresetPermissionsGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewId(),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_ADMIN_PRESET_NAME,
    description:
      'Auto-generated preset that can access and perform every and all actions on all resources',
  };

  const publicPreset: IPresetPermissionsGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewId(),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_PUBLIC_PRESET_NAME,
    description:
      'Auto-generated preset for accessing and performing public operations.',
  };

  const collaboratorPreset: IPresetPermissionsGroup = {
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    resourceId: getNewId(),
    workspaceId: workspace.resourceId,
    createdBy: agent,
    name: DEFAULT_COLLABORATOR_PRESET_NAME,
    description: 'Auto-generated preset for collaborators.',
  };

  await context.data.preset.bulkSaveItems([
    adminPreset,
    publicPreset,
    collaboratorPreset,
  ]);

  const permissionItems: IPermissionItem[] = makeAdminPermissions(
    agent,
    workspace,
    adminPreset
  ).concat(makeCollaboratorPermissions(agent, workspace, collaboratorPreset));
  await context.data.permissionItem.bulkSaveItems(permissionItems);
  return {adminPreset, publicPreset, collaboratorPreset};
}

export async function addWorkspaceToUserAndAssignAdminPreset(
  context: IBaseContext,
  user: IUser,
  workspace: IWorkspace,
  adminPreset: IPresetPermissionsGroup
) {
  const agent: IAgent = {
    agentId: user.resourceId,
    agentType: SessionAgentType.User,
  };

  await Promise.all([
    // Assign workspace to user
    addAssignedUserWorkspace(context, agent, workspace.resourceId, user),

    // Assign admin preset to user
    addAssignedPresetList(
      context,
      agent,
      workspace,
      [{presetId: adminPreset.resourceId, order: 0}],
      user.resourceId,
      AppResourceType.User,
      /** deleteExisting */ false,
      /** skipPresetsCheck */ true
    ),
  ]);

  return await withUserWorkspaces(context, user);
}
