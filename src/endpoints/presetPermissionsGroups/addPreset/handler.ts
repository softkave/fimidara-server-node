import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import PresetPermissionsGroupQueries from '../queries';
import {PresetPermissionsGroupUtils} from '../utils';
import {AddPresetPermissionsGroupEndpoint} from './types';
import {addPresetPermissionsGroupJoiSchema} from './validation';
import {ResourceExistsError} from '../../errors';

/**
 * addPresetPermissionsGroup.
 * Creates a preset permission group.
 *
 * Ensure that:
 * - Auth check
 * - Check that preset doesn't exist
 * - Save preset
 */

const addPresetPermissionsGroup: AddPresetPermissionsGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addPresetPermissionsGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkAuthorization(
    context,
    agent,
    organization.resourceId,
    null,
    AppResourceType.PresetPermissionsGroup,
    makeBasePermissionOwnerList(organization.resourceId),
    BasicCRUDActions.Create
  );

  const itemExists = await context.data.preset.checkItemExists(
    PresetPermissionsGroupQueries.getByOrganizationAndName(
      organization.resourceId,
      data.preset.name
    )
  );

  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }

  // TODO: validate that the presets being assigned exist. Do same for other endpoints.
  const preset = await context.data.preset.saveItem({
    ...data.preset,
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    organizationId: organization.resourceId,
    presets: (data.preset.presets || []).map(preset => ({
      ...preset,
      assignedAt: getDateString(),
      assignedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    })),
  });

  return {
    preset: PresetPermissionsGroupUtils.extractPublicPresetPermissionsGroup(
      preset
    ),
  };
};

export default addPresetPermissionsGroup;
