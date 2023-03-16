import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {newWorkspaceResource} from '../../../utils/fns';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
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
    workspaceId: workspace.resourceId,
    targets: [{type: AppResourceType.PermissionGroup}],
    action: BasicCRUDActions.Create,
  });

  await checkPermissionGroupNameExists(context, workspace.resourceId, data.permissionGroup.name);
  let permissionGroup = newWorkspaceResource(
    agent,
    AppResourceType.PermissionGroup,
    workspace.resourceId,
    {
      ...data.permissionGroup,
      workspaceId: workspace.resourceId,
    }
  );
  await context.semantic.permissionGroup.insertItem(permissionGroup);
  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    permissionGroup.resourceId,
    data.permissionGroup
  );
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
