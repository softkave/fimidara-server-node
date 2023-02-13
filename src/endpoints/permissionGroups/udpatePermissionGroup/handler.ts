import {omit} from 'lodash';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists';
import {checkPermissionGroupAuthorization03, permissionGroupExtractor} from '../utils';
import {UpdatePermissionGroupEndpoint} from './types';
import {updatePermissionGroupJoiSchema} from './validation';

const updatePermissionGroup: UpdatePermissionGroupEndpoint = async (context, instData) => {
  const data = validate(instData.data, updatePermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const checkResult = await checkPermissionGroupAuthorization03(context, agent, data, BasicCRUDActions.Update);
  const workspace = checkResult.workspace;
  let permissionGroup = checkResult.permissionGroup;
  const update: Partial<IPermissionGroup> = {
    ...omit(data.data, 'permissionGroups'),
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {agentId: agent.agentId, agentType: agent.agentType},
  };

  if (update.name && update.name !== permissionGroup.name) {
    await checkPermissionGroupNameExists(context, workspace.resourceId, update.name);
  }

  permissionGroup = await context.data.permissiongroup.assertGetAndUpdateOneByQuery(
    EndpointReusableQueries.getByResourceId(permissionGroup.resourceId),
    update
  );
  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    permissionGroup.resourceId,
    AppResourceType.PermissionGroup,
    data.data
  );
  permissionGroup = await populateAssignedPermissionGroupsAndTags(
    context,
    permissionGroup.workspaceId,
    permissionGroup,
    AppResourceType.PermissionGroup
  );

  return {
    permissionGroup: permissionGroupExtractor(permissionGroup),
  };
};

export default updatePermissionGroup;
