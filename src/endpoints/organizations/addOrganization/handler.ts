import {IOrganization} from '../../../definitions/organization';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {
  AppResourceType,
  BasicCRUDActions,
  orgResourceTypes,
  SessionAgentType,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {updateCollaboratorOrganization} from '../../collaborators/utils';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {organizationExtractor} from '../utils';
import {AddOrganizationEndpoint} from './types';
import {addOrganizationJoiSchema} from './validation';

/**
 * addOrganization. Ensure that:
 * - Create and return organization
 */

const addOrganization: AddOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, addOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const organization = await context.data.organization.saveItem({
    createdAt: getDateString(),
    createdBy: {
      agentId: user.resourceId,
      agentType: SessionAgentType.User,
    },
    name: data.name,
    resourceId: getNewId(),
    description: data.description,
  });

  updateCollaboratorOrganization(user, organization.resourceId, () => ({
    organizationId: organization.resourceId,
    joinedAt: getDateString(),
    presets: [],
  }));

  await context.data.user.updateItem(
    EndpointReusableQueries.getById(user.resourceId),
    {
      organizations: user.organizations,
    }
  );

  await setupAdminPreset(context, user, organization);
  return {
    organization: organizationExtractor(organization),
  };
};

async function setupAdminPreset(
  context: IBaseContext,
  user: IUser,
  organization: IOrganization
) {
  const adminPreset: IPresetPermissionsGroup = {
    resourceId: getNewId(),
    organizationId: organization.resourceId,
    createdAt: getDateString(),
    createdBy: {
      agentId: user.resourceId,
      agentType: SessionAgentType.User,
    },
    name: 'Admin',
    description:
      'Auto-generated preset that can access and perform every and all actions on all resources',
    presets: [],
  };

  await context.data.preset.saveItem(adminPreset);
  const permissionItems: IPermissionItem[] = [AppResourceType.Organization]
    .concat(orgResourceTypes)
    .map(type => {
      return {
        resourceId: getNewId(),
        organizationId: organization.resourceId,
        createdAt: getDateString(),
        createdBy: {
          agentId: user.resourceId,
          agentType: SessionAgentType.User,
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

  await context.data.user.updateItem(
    EndpointReusableQueries.getById(user.resourceId),
    {
      organizations: user.organizations,
    }
  );
}

export default addOrganization;
