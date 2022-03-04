import {IOrganization} from '../../../definitions/organization';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {
  SessionAgentType,
  AppResourceType,
  BasicCRUDActions,
  IAgent,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {updateCollaboratorOrganization} from '../../collaborators/utils';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';

export const DEFAULT_ADMIN_PRESET_NAME = 'admin';
export async function setupAdminPreset(
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
    presets: [],
  };

  await context.data.preset.saveItem(adminPreset);
  const permissionItems: IPermissionItem[] = [AppResourceType.All].map(type => {
    return {
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
      itemResourceType: type,
      action: BasicCRUDActions.All,
    };
  });

  await context.data.permissionItem.bulkSaveItems(permissionItems);
  return adminPreset;
}

export async function assignAdminPresetToUser(
  context: IBaseContext,
  user: IUser,
  organization: IOrganization,
  adminPreset: IPresetPermissionsGroup
) {
  updateCollaboratorOrganization(user, organization.resourceId, data => {
    data?.presets.push({
      presetId: adminPreset.resourceId,
      assignedAt: getDateString(),
      assignedBy: {
        agentId: user.resourceId,
        agentType: SessionAgentType.User,
      },
      order: 0,
    });

    return data;
  });

  return await context.data.user.updateItem(
    EndpointReusableQueries.getById(user.resourceId),
    {
      organizations: user.organizations,
    }
  );
}
