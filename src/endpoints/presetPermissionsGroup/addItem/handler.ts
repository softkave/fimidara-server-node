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
import {PresetPermissionsItemUtils} from '../utils';
import {AddPresetPermissionsItemEndpoint} from './types';
import {addPresetPermissionsItemJoiSchema} from './validation';
import {ResourceExistsError} from '../../errors';

const addPresetPermissionsItems: AddPresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addPresetPermissionsItemJoiSchema);
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
      data.item.name
    )
  );

  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }

  const item = await context.data.presetPermissionsGroup.saveItem({
    ...data.item,
    presetId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    organizationId: organization.organizationId,
    presets: (data.item.presets || []).map(preset => ({
      ...preset,
      assignedAt: getDateString(),
      assignedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    })),
  });

  return {
    item: PresetPermissionsItemUtils.extractPublicPresetPermissionsItem(item),
  };
};

export default addPresetPermissionsItems;
