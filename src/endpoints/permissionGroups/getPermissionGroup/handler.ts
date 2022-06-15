import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {withAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkPermissionGroupAuthorization03,
  permissionGroupExtractor,
} from '../utils';
import {GetPermissionGroupEndpoint} from './types';
import {getPermissionGroupJoiSchema} from './validation';

const getPermissionGroup: GetPermissionGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getPermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {permissionGroup} = await checkPermissionGroupAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Read
  );

  permissionGroup = await withAssignedPermissionGroupsAndTags(
    context,
    permissionGroup.workspaceId,
    permissionGroup,
    AppResourceType.PermissionGroup
  );

  return {
    permissionGroup: permissionGroupExtractor(permissionGroup),
  };
};

export default getPermissionGroup;
