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
    organization.organizationId,
    null,
    AppResourceType.PresetPermissionsGroup,
    makeBasePermissionOwnerList(organization.organizationId),
    BasicCRUDActions.Create
  );

  const itemExists = await context.data.presetPermissionsGroup.checkItemExists(
    PresetPermissionsGroupQueries.getByOrganizationAndName(
      organization.organizationId,
      data.preset.name
    )
  );

  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }

  // TODO: validate that the presets being assigned exist. Do same for other endpoints.
  const preset = await context.data.presetPermissionsGroup.saveItem({
    ...data.preset,
    presetId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    organizationId: organization.organizationId,
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
