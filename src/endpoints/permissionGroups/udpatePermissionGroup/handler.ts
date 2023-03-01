import {omit} from 'lodash';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {BasicCRUDActions} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists';
import {checkPermissionGroupAuthorization03, permissionGroupExtractor} from '../utils';
import {UpdatePermissionGroupEndpoint} from './types';
import {updatePermissionGroupJoiSchema} from './validation';

const updatePermissionGroup: UpdatePermissionGroupEndpoint = async (context, instData) => {
  const data = validate(instData.data, updatePermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {workspace, permissionGroup} = await checkPermissionGroupAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Update
  );
  const update: Partial<IPermissionGroup> = {
    ...omit(data.data, 'permissionGroups'),
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };

  if (update.name && update.name !== permissionGroup.name) {
    await checkPermissionGroupNameExists(context, workspace.resourceId, update.name);
  }

  permissionGroup = await context.semantic.permissionGroup.getAndUpdateOneById(
    permissionGroup.resourceId,
    update
  );
  await saveResourceAssignedItems(context, agent, workspace, permissionGroup.resourceId, data.data);
  permissionGroup = await populateAssignedTags(
    context,
    permissionGroup.workspaceId,
    permissionGroup
  );

  return {permissionGroup: permissionGroupExtractor(permissionGroup!)};
};

export default updatePermissionGroup;
