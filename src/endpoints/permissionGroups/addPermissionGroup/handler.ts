import {PermissionGroup} from '../../../definitions/permissionGroups';
import {AppActionType, AppResourceType} from '../../../definitions/system';
import {newWorkspaceResource} from '../../../utils/resource';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists';
import {permissionGroupExtractor} from '../utils';
import {AddPermissionGroupEndpoint} from './types';
import {addPermissionGroupJoiSchema} from './validation';

const addPermissionGroup: AddPermissionGroupEndpoint = async (context, instData) => {
  const data = validate(instData.data, addPermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    targets: {targetType: AppResourceType.PermissionGroup},
    action: AppActionType.Create,
  });

  let permissionGroup = await executeWithMutationRunOptions(context, async opts => {
    await checkPermissionGroupNameExists(
      context,
      workspace.resourceId,
      data.permissionGroup.name,
      opts
    );
    const permissionGroup = newWorkspaceResource<PermissionGroup>(
      agent,
      AppResourceType.PermissionGroup,
      workspace.resourceId,
      {
        ...data.permissionGroup,
        workspaceId: workspace.resourceId,
      }
    );
    await context.semantic.permissionGroup.insertItem(permissionGroup, opts);
    return permissionGroup;
  });

  permissionGroup = await populateAssignedTags(
    context,
    permissionGroup.workspaceId,
    permissionGroup
  );
  return {
    permissionGroup: permissionGroupExtractor(permissionGroup),
  };
};

export default addPermissionGroup;
