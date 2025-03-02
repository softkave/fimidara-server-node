import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {checkWorkspaceExists} from '../../workspaces/utils.js';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists.js';
import {permissionGroupExtractor} from '../utils.js';
import {AddPermissionGroupEndpoint} from './types.js';
import {addPermissionGroupJoiSchema} from './validation.js';

const addPermissionGroup: AddPermissionGroupEndpoint = async reqData => {
  const data = validate(reqData.data, addPermissionGroupJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'updatePermission'},
  });

  let permissionGroup = await kIjxSemantic.utils().withTxn(async opts => {
    await checkPermissionGroupNameExists({
      workspaceId: workspace.resourceId,
      name: data.name,
      opts,
    });
    const permissionGroup = newWorkspaceResource<PermissionGroup>(
      agent,
      kFimidaraResourceType.PermissionGroup,
      workspace.resourceId,
      {...data, workspaceId: workspace.resourceId}
    );
    await kIjxSemantic.permissionGroup().insertItem(permissionGroup, opts);
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
