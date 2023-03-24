import {AppActionType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkPermissionGroupAuthorization03, permissionGroupExtractor} from '../utils';
import {GetPermissionGroupEndpoint} from './types';
import {getPermissionGroupJoiSchema} from './validation';

const getPermissionGroup: GetPermissionGroupEndpoint = async (context, instData) => {
  const data = validate(instData.data, getPermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {permissionGroup} = await checkPermissionGroupAuthorization03(
    context,
    agent,
    data,
    AppActionType.Read
  );

  permissionGroup = await populateAssignedTags(
    context,
    permissionGroup.workspaceId,
    permissionGroup
  );
  return {
    permissionGroup: permissionGroupExtractor(permissionGroup),
  };
};

export default getPermissionGroup;
