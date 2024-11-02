import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {permissionGroupListExtractor} from '../utils.js';
import {GetAssignedPermissionGroupsEndpoint} from './types.js';
import {
  checkReadAssignedPermissionGroups,
  fetchAssignedPermissionGroupList,
} from './utils.js';
import {getAssignedPermissionGroupsJoiSchema} from './validation.js';

const getAssignedPermissionGroupsEndpoint: GetAssignedPermissionGroupsEndpoint =
  async reqData => {
    const data = validate(reqData.data, getAssignedPermissionGroupsJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {data});

    await checkReadAssignedPermissionGroups(agent, workspace, data.entityId);
    const result = await fetchAssignedPermissionGroupList(
      data.entityId,
      data.includeInheritedPermissionGroups ?? false
    );

    return {
      permissionGroups: permissionGroupListExtractor(result.permissionGroups),
      immediateAssignedPermissionGroupsMeta:
        result.inheritanceMap[data.entityId]?.items ?? [],
    };
  };

export default getAssignedPermissionGroupsEndpoint;
