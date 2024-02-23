import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkPermissionGroupAuthorization03, permissionGroupExtractor} from '../utils';
import {GetPermissionGroupEndpoint} from './types';
import {getPermissionGroupJoiSchema} from './validation';

const getPermissionGroup: GetPermissionGroupEndpoint = async instData => {
  const data = validate(instData.data, getPermissionGroupJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
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
