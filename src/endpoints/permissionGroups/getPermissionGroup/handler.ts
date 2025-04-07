import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {
  checkPermissionGroupAuthorization03,
  permissionGroupExtractor,
} from '../utils.js';
import {GetPermissionGroupEndpoint} from './types.js';
import {getPermissionGroupJoiSchema} from './validation.js';

const getPermissionGroup: GetPermissionGroupEndpoint = async reqData => {
  const data = validate(reqData.data, getPermissionGroupJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  let {permissionGroup} = await checkPermissionGroupAuthorization03(
    agent,
    data,
    'readPermission'
  );

  permissionGroup = await populateAssignedTags(
    permissionGroup.workspaceId,
    permissionGroup
  );
  return {
    permissionGroup: permissionGroupExtractor(permissionGroup),
  };
};

export default getPermissionGroup;
