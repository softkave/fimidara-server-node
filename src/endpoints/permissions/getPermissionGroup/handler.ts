import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  checkPermissionGroupAuthorization,
  getPermissionGroupByMatcher,
  permissionGroupExtractor,
} from '../utils.js';
import {GetPermissionGroupEndpoint} from './types.js';
import {getPermissionGroupJoiSchema} from './validation.js';

const getPermissionGroupEndpoint: GetPermissionGroupEndpoint =
  async reqData => {
    const data = validate(reqData.data, getPermissionGroupJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const {permissionGroup} = await getPermissionGroupByMatcher(
      workspaceId,
      data
    );
    await checkPermissionGroupAuthorization(
      agent,
      permissionGroup,
      kFimidaraPermissionActions.readPermission
    );

    return {permissionGroup: permissionGroupExtractor(permissionGroup)};
  };

export default getPermissionGroupEndpoint;
