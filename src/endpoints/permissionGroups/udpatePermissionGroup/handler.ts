import {omit} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists.js';
import {
  assertPermissionGroup,
  checkPermissionGroupAuthorization03,
  permissionGroupExtractor,
} from '../utils.js';
import {UpdatePermissionGroupEndpoint} from './types.js';
import {updatePermissionGroupJoiSchema} from './validation.js';

const updatePermissionGroup: UpdatePermissionGroupEndpoint = async reqData => {
  const data = validate(reqData.data, updatePermissionGroupJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  let permissionGroup = await kIjxSemantic.utils().withTxn(async opts => {
    const {workspace, permissionGroup} =
      await checkPermissionGroupAuthorization03(
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
      await checkPermissionGroupNameExists({
        workspaceId: workspace.resourceId,
        name: update.name,
        resourceId: permissionGroup.resourceId,
        opts,
      });
    }

    const updatedPermissionGroup = await kIjxSemantic
      .permissionGroup()
      .getAndUpdateOneById(permissionGroup.resourceId, update, opts);
    assertPermissionGroup(updatedPermissionGroup);
    return updatedPermissionGroup;
  });

  permissionGroup = await populateAssignedTags(
    permissionGroup.workspaceId,
    permissionGroup
  );
  return {permissionGroup: permissionGroupExtractor(permissionGroup!)};
};

export default updatePermissionGroup;
