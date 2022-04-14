import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {AddPresetPermissionsGroupEndpoint} from './types';
import {addPresetPermissionsGroupJoiSchema} from './validation';
import {checkPresetNameExists} from '../checkPresetNameExists';
import {presetPermissionsGroupExtractor} from '../utils';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {getWorkspaceId} from '../../contexts/SessionContext';

const addPresetPermissionsGroup: AddPresetPermissionsGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addPresetPermissionsGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    type: AppResourceType.PresetPermissionsGroup,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
    action: BasicCRUDActions.Create,
  });

  await checkPresetNameExists(context, workspace.resourceId, data.preset.name);
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };

  let preset = await context.data.preset.saveItem({
    ...data.preset,
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewId(),
    workspaceId: workspace.resourceId,
  });

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    preset.resourceId,
    AppResourceType.PresetPermissionsGroup,
    data.preset
  );

  preset = await withAssignedPresetsAndTags(
    context,
    preset.workspaceId,
    preset,
    AppResourceType.PresetPermissionsGroup
  );

  return {
    preset: presetPermissionsGroupExtractor(preset),
  };
};

export default addPresetPermissionsGroup;
