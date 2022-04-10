import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import {AddPresetPermissionsGroupEndpoint} from './types';
import {addPresetPermissionsGroupJoiSchema} from './validation';
import {checkPresetNameExists} from '../checkPresetNameExists';
import {presetPermissionsGroupExtractor} from '../utils';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';

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

  await checkAuthorization({
    context,
    agent,
    organization,
    type: AppResourceType.PresetPermissionsGroup,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
    action: BasicCRUDActions.Create,
  });

  await checkPresetNameExists(
    context,
    organization.resourceId,
    data.preset.name
  );

  let preset = await context.data.preset.saveItem({
    ...data.preset,
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    organizationId: organization.resourceId,
  });

  await saveResourceAssignedItems(
    context,
    agent,
    organization,
    preset.resourceId,
    AppResourceType.PresetPermissionsGroup,
    data.preset
  );

  preset = await withAssignedPresetsAndTags(
    context,
    preset.organizationId,
    preset,
    AppResourceType.PresetPermissionsGroup
  );

  return {
    preset: presetPermissionsGroupExtractor(preset),
  };
};

export default addPresetPermissionsGroup;
