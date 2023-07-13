import {omit} from 'lodash';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {AppActionType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists';
import {
  assertPermissionGroup,
  checkPermissionGroupAuthorization03,
  permissionGroupExtractor,
} from '../utils';
import {UpdatePermissionGroupEndpoint} from './types';
import {updatePermissionGroupJoiSchema} from './validation';

const updatePermissionGroup: UpdatePermissionGroupEndpoint = async (context, instData) => {
  const data = validate(instData.data, updatePermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let permissionGroup = await context.semantic.utils.withTxn(context, async opts => {
    const {workspace, permissionGroup} = await checkPermissionGroupAuthorization03(
      context,
      agent,
      data,
      AppActionType.Update,
      opts
    );
    const update: Partial<PermissionGroup> = {
      ...omit(data.data, 'permissionGroups'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };

    if (update.name && update.name !== permissionGroup.name) {
      await checkPermissionGroupNameExists(context, workspace.resourceId, update.name, opts);
    }

    const updatedPermissionGroup = await context.semantic.permissionGroup.getAndUpdateOneById(
      permissionGroup.resourceId,
      update,
      opts
    );
    assertPermissionGroup(updatedPermissionGroup);
    return updatedPermissionGroup;
  });

  permissionGroup = await populateAssignedTags(
    context,
    permissionGroup.workspaceId,
    permissionGroup
  );
  return {permissionGroup: permissionGroupExtractor(permissionGroup!)};
};

export default updatePermissionGroup;
