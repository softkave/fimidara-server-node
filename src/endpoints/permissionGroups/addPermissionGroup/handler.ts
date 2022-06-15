import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists';
import {permissionGroupExtractor} from '../utils';
import {AddPermissionGroupEndpoint} from './types';
import {addPermissionGroupJoiSchema} from './validation';

const addPermissionGroup: AddPermissionGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addPermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    type: AppResourceType.PermissionGroup,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
    action: BasicCRUDActions.Create,
  });

  await checkPermissionGroupNameExists(
    context,
    workspace.resourceId,
    data.permissionGroup.name
  );
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };

  let permissionGroup = await context.data.permissiongroup.saveItem({
    ...data.permissionGroup,
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
    permissionGroup.resourceId,
    AppResourceType.PermissionGroup,
    data.permissionGroup
  );

  permissionGroup = await withAssignedPermissionGroupsAndTags(
    context,
    permissionGroup.workspaceId,
    permissionGroup,
    AppResourceType.PermissionGroup
  );

  return {
    permissionGroup: permissionGroupExtractor(permissionGroup),
  };
};

export default addPermissionGroup;