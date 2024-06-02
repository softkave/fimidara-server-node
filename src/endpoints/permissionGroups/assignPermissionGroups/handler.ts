import {toNonNullableArray} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {checkPermissionEntitiesExist} from '../../permissionItems/checkPermissionArtifacts.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {checkPermissionGroupsExist} from '../utils.js';
import {AssignPermissionGroupsEndpoint} from './types.js';
import {assignPermissionGroupsJoiSchema} from './validation.js';

const assignPermissionGroups: AssignPermissionGroupsEndpoint =
  async instData => {
    const data = validate(instData.data, assignPermissionGroupsJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    await checkAuthorizationWithAgent({
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      target: {targetId: workspace.resourceId, action: 'updatePermission'},
    });
    const entityIdList = toNonNullableArray(data.entityId);
    await Promise.all([
      await checkPermissionEntitiesExist(
        agent,
        workspace.resourceId,
        entityIdList,
        'updatePermission'
      ),
      await checkPermissionGroupsExist(
        workspace.resourceId,
        data.permissionGroups
      ),
    ]);

    await kSemanticModels.utils().withTxn(async opts => {
      // TODO: getEntityAssignedPermissionGroups should support entity ID array

      // Get entities' immediately existing permission groups to avoid assigning
      // twice
      const existingPermissionGroups = await Promise.all(
        entityIdList.map(entityId =>
          kSemanticModels
            .permissions()
            .getEntityAssignedPermissionGroups(
              {entityId, fetchDeep: false},
              opts
            )
        )
      );

      // Filter out permission groups already assigned leaving the ones unassigned
      const unassignedPermissionGroupsByEntity = entityIdList.map(
        (entityId, i) => {
          const {inheritanceMap} = existingPermissionGroups[i];
          return data.permissionGroups.filter(
            permissionGroup =>
              !inheritanceMap[permissionGroup.permissionGroupId]
          );
        }
      );

      await Promise.all(
        unassignedPermissionGroupsByEntity.map((permissionGroupList, i) => {
          const entityId = entityIdList[i];
          if (!permissionGroupList.length) return;

          // Assign permission groups to entity
          return addAssignedPermissionGroupList(
            agent,
            workspace.resourceId,
            permissionGroupList,
            entityId,
            false, // don't delete existing assigned permission groups
            true, // skip permission groups check
            /** skip auth check */ true,
            opts
          );
        })
      );
    });
  };

export default assignPermissionGroups;
