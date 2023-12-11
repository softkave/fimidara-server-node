import {PermissionGroup} from '../../../definitions/permissionGroups';
import {AppResourceTypeMap} from '../../../definitions/system';
import {newWorkspaceResource} from '../../../utils/resource';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists';
import {permissionGroupExtractor} from '../utils';
import {AddPermissionGroupEndpoint} from './types';
import {addPermissionGroupJoiSchema} from './validation';

const addPermissionGroup: AddPermissionGroupEndpoint = async instData => {
  const data = validate(instData.data, addPermissionGroupJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'updatePermission'},
  });

  let permissionGroup = await kSemanticModels.utils().withTxn(async opts => {
    await checkPermissionGroupNameExists(
      workspace.resourceId,
      data.permissionGroup.name,
      opts
    );
    const permissionGroup = newWorkspaceResource<PermissionGroup>(
      agent,
      AppResourceTypeMap.PermissionGroup,
      workspace.resourceId,
      {...data.permissionGroup, workspaceId: workspace.resourceId}
    );
    await kSemanticModels.permissionGroup().insertItem(permissionGroup, opts);
    return permissionGroup;
  });

  permissionGroup = await populateAssignedTags(
    permissionGroup.workspaceId,
    permissionGroup
  );
  return {
    permissionGroup: permissionGroupExtractor(permissionGroup),
  };
};

export default addPermissionGroup;
