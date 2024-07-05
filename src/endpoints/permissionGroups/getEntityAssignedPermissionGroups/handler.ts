import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {permissionGroupListExtractor} from '../utils.js';
import {GetEntityAssignedPermissionGroupsEndpoint} from './types.js';
import {
  checkReadEntityAssignedPermissionGroups,
  fetchEntityAssignedPermissionGroupList,
} from './utils.js';
import {getEntityAssignedPermissionGroupsJoiSchema} from './validation.js';

const getEntityAssignedPermissionGroups: GetEntityAssignedPermissionGroupsEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      getEntityAssignedPermissionGroupsJoiSchema
    );
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    await checkReadEntityAssignedPermissionGroups(
      agent,
      workspace,
      data.entityId
    );
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
