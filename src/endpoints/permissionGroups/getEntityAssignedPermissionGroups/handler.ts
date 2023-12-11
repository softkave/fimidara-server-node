import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {permissionGroupListExtractor} from '../utils';
import {GetEntityAssignedPermissionGroupsEndpoint} from './types';
import {
  checkReadEntityAssignedPermissionGroups,
  fetchEntityAssignedPermissionGroupList,
} from './utils';
import {getEntityAssignedPermissionGroupsJoiSchema} from './validation';

const getEntityAssignedPermissionGroups: GetEntityAssignedPermissionGroupsEndpoint =
  async instData => {
    const data = validate(instData.data, getEntityAssignedPermissionGroupsJoiSchema);
    const agent = await kUtilsInjectables.session().getAgent(instData);
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    await checkReadEntityAssignedPermissionGroups(agent, workspace, data.entityId);
    const result = await fetchEntityAssignedPermissionGroupList(
      data.entityId,
      data.includeInheritedPermissionGroups ?? false
    );
    return {
      permissionGroups: permissionGroupListExtractor(result.permissionGroups),
      immediateAssignedPermissionGroupsMeta:
        result.inheritanceMap[data.entityId]?.items ?? [],
    };
  };

export default getEntityAssignedPermissionGroups;
