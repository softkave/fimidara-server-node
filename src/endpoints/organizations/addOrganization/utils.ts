import {IOrganization} from '../../../definitions/organization';
import {
  IPermissionItem,
  PermissionItemAppliesTo,
} from '../../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {
  SessionAgentType,
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  getOrgActionList,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {
  addAssignedPresetList,
  addAssignedUserOrganization,
} from '../../assignedItems/addAssignedItems';
import {withUserOrganizations} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {permissionItemIndexer} from '../../permissionItems/utils';

export const DEFAULT_ADMIN_PRESET_NAME = 'Admin';
export const DEFAULT_PUBLIC_PRESET_NAME = 'Public';
export const DEFAULT_COLLABORATOR_PRESET_NAME = 'Collaborator';

function makeAdminPermissions(
  agent: IAgent,
  organization: IOrganization,
  adminPreset: IPresetPermissionsGroup
) {
  const permissionItems: IPermissionItem[] = getOrgActionList().map(action => {
    const item: IPermissionItem = {
      action,
      resourceId: getNewId(),
      organizationId: organization.resourceId,
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      permissionOwnerId: organization.resourceId,
      permissionOwnerType: AppResourceType.Organization,
      permissionEntityId: adminPreset.resourceId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
      itemResourceType: AppResourceType.All,
      hash: '',
      appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
      grantAccess: true,
    };

    item.hash = permissionItemIndexer(item);
    return item;
  });

  return permissionItems;
}

function makeCollaboratorPermissions(
  agent: IAgent,
  organization: IOrganization,
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
        organizationId: organization.resourceId,
        createdAt: getDateString(),
        createdBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
        permissionOwnerId: organization.resourceId,
        permissionOwnerType: AppResourceType.Organization,
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
      AppResourceType.Organization,
      organization.resourceId
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

export async function setupDefaultOrgPresets(
  context: IBaseContext,
  agent: IAgent,
  organization: IOrganization
) {
  const adminPreset: IPresetPermissionsGroup = {
    resourceId: getNewId(),
    organizationId: organization.resourceId,
    createdAt: getDateString(),
    createdBy: agent,
    name: DEFAULT_ADMIN_PRESET_NAME,
    description:
      'Auto-generated preset that can access and perform every and all actions on all resources',
  };

  const publicPreset: IPresetPermissionsGroup = {
    resourceId: getNewId(),
    organizationId: organization.resourceId,
    createdAt: getDateString(),
    createdBy: agent,
    name: DEFAULT_PUBLIC_PRESET_NAME,
    description:
      'Auto-generated preset for accessing and performing public operations.',
  };

  const collaboratorPreset: IPresetPermissionsGroup = {
    resourceId: getNewId(),
    organizationId: organization.resourceId,
    createdAt: getDateString(),
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
    organization,
    adminPreset
  ).concat(
    makeCollaboratorPermissions(agent, organization, collaboratorPreset)
  );

  await context.data.permissionItem.bulkSaveItems(permissionItems);
  return {adminPreset, publicPreset, collaboratorPreset};
}

export async function addOrgToUserAndAssignAdminPreset(
  context: IBaseContext,
  user: IUser,
  organization: IOrganization,
  adminPreset: IPresetPermissionsGroup
) {
  const agent: IAgent = {
    agentId: user.resourceId,
    agentType: SessionAgentType.User,
  };

  await Promise.all([
    // Assign organization to user
    addAssignedUserOrganization(context, agent, organization.resourceId, user),

    // Assign admin preset to user
    addAssignedPresetList(
      context,
      agent,
      organization,
      [{presetId: adminPreset.resourceId, order: 0}],
      user.resourceId,
      AppResourceType.User,
      false
    ),
  ]);

  return await withUserOrganizations(context, user);
}
