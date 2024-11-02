import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  getPermissionGroupByMatcher,
  permissionGroupExtractor,
} from '../utils.js';
import {GetPermissionGroupEndpoint} from './types.js';
import {getPermissionGroupJoiSchema} from './validation.js';

const getPermissionGroupEndpoint: GetPermissionGroupEndpoint =
  async reqData => {
    const data = validate(reqData.data, getPermissionGroupJoiSchema);
    const {workspace} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.readPermission,
    });

    const {permissionGroup} = await getPermissionGroupByMatcher(
      workspace.resourceId,
      data
    );

    return {permissionGroup: permissionGroupExtractor(permissionGroup)};
  };

export default getPermissionGroupEndpoint;
