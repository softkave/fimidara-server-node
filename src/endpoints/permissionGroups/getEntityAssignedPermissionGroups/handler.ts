import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
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
    const agent = await kIjxUtils
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
    const result = await fetchEntityAssignedPermissionGroupList({
      workspaceId: workspace.resourceId,
      entityId: data.entityId,
      includeInheritedPermissionGroups:
        data.includeInheritedPermissionGroups ?? false,
    });

    return {
      permissionGroups: permissionGroupListExtractor(result.permissionGroups),
      immediateAssignedPermissionGroupsMeta:
        result.inheritanceMap[data.entityId]?.items ?? [],
    };
  };

export default getEntityAssignedPermissionGroups;
