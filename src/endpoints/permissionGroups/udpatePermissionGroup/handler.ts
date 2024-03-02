import {omit} from 'lodash';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists';
import {
  assertPermissionGroup,
  checkPermissionGroupAuthorization03,
  permissionGroupExtractor,
} from '../utils';
import {UpdatePermissionGroupEndpoint} from './types';
import {updatePermissionGroupJoiSchema} from './validation';

const updatePermissionGroup: UpdatePermissionGroupEndpoint = async instData => {
  const data = validate(instData.data, updatePermissionGroupJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  let permissionGroup = await kSemanticModels.utils().withTxn(async opts => {
    const {workspace, permissionGroup} = await checkPermissionGroupAuthorization03(
      agent,
      data,
      'updatePermission',
      opts
    );
    const update: Partial<PermissionGroup> = {
      ...omit(data.data, 'permissionGroups'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };

    if (update.name && update.name !== permissionGroup.name) {
      await checkPermissionGroupNameExists(workspace.resourceId, update.name, opts);
    }

    const updatedPermissionGroup = await kSemanticModels
      .permissionGroup()
      .getAndUpdateOneById(permissionGroup.resourceId, update, opts);
    assertPermissionGroup(updatedPermissionGroup);
    return updatedPermissionGroup;
  }, /** reuseTxn */ false);

  permissionGroup = await populateAssignedTags(
    permissionGroup.workspaceId,
    permissionGroup
  );
  return {permissionGroup: permissionGroupExtractor(permissionGroup!)};
};

export default updatePermissionGroup;
