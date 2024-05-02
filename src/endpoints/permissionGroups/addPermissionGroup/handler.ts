import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkWorkspaceExists} from '../../workspaces/utils.js';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists.js';
import {permissionGroupExtractor} from '../utils.js';
import {AddPermissionGroupEndpoint} from './types.js';
import {addPermissionGroupJoiSchema} from './validation.js';

const addPermissionGroup: AddPermissionGroupEndpoint = async instData => {
  const data = validate(instData.data, addPermissionGroupJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
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

  let permissionGroup = await kSemanticModels.utils().withTxn(async opts => {
    await checkPermissionGroupNameExists(
      workspace.resourceId,
      data.permissionGroup.name,
      opts
    );
    const permissionGroup = newWorkspaceResource<PermissionGroup>(
      agent,
      kFimidaraResourceType.PermissionGroup,
      workspace.resourceId,
      {...data.permissionGroup, workspaceId: workspace.resourceId}
    );
    await kSemanticModels.permissionGroup().insertItem(permissionGroup, opts);
    return permissionGroup;
  }, /** reuseTxn */ false);

  permissionGroup = await populateAssignedTags(
    permissionGroup.workspaceId,
    permissionGroup
  );
  return {
    permissionGroup: permissionGroupExtractor(permissionGroup),
  };
};

export default addPermissionGroup;
