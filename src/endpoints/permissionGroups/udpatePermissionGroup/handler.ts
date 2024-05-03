import {omit} from 'lodash-es';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists.js';
import {
  assertPermissionGroup,
  checkPermissionGroupAuthorization03,
  permissionGroupExtractor,
} from '../utils.js';
import {UpdatePermissionGroupEndpoint} from './types.js';
import {updatePermissionGroupJoiSchema} from './validation.js';

const updatePermissionGroup: UpdatePermissionGroupEndpoint = async instData => {
  const data = validate(instData.data, updatePermissionGroupJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  let permissionGroup = await kSemanticModels.utils().withTxn(async opts => {
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
      await checkPermissionGroupNameExists(
        workspace.resourceId,
        update.name,
        opts
      );
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
