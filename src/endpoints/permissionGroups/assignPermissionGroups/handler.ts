import {AppActionType, AppResourceType} from '../../../definitions/system';
import {toNonNullableArray} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {checkPermissionEntitiesExist} from '../../permissionItems/checkPermissionArtifacts';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkPermissionGroupsExist} from '../utils';
import {AssignPermissionGroupsEndpoint} from './types';
import {assignPermissionGroupsJoiSchema} from './validation';

const assignPermissionGroups: AssignPermissionGroupsEndpoint = async (context, instData) => {
  const data = validate(instData.data, assignPermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorization({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    action: AppActionType.GrantPermission,
    targets: {targetType: AppResourceType.PermissionGroup},
  });
  const entityIdList = toNonNullableArray(data.entityId);
  await Promise.all([
    await checkPermissionEntitiesExist(
      context,
      agent,
      workspace.resourceId,
      entityIdList,
      AppActionType.Read
    ),
    await checkPermissionGroupsExist(context, workspace.resourceId, data.permissionGroups),
  ]);

  await executeWithMutationRunOptions(context, async opts => {
    // TODO: getEntityAssignedPermissionGroups should support entity ID array

    // Get entities' immediately existing permission groups to avoid assigning
    // twice
    const existingPermissionGroups = await Promise.all(
      entityIdList.map(entityId =>
        context.semantic.permissions.getEntityAssignedPermissionGroups(
          {context, entityId, fetchDeep: false},
          opts
        )
      )
    );

    // Filter out permission groups already assigned leaving the ones unassigned
    const unassignedPermissionGroupsByEntity = entityIdList.map((entityId, i) => {
      const {inheritanceMap} = existingPermissionGroups[i];
      return data.permissionGroups.filter(
        permissionGroup => !inheritanceMap[permissionGroup.permissionGroupId]
      );
    });

    await Promise.all(
      unassignedPermissionGroupsByEntity.map((permissionGroupList, i) => {
        const entityId = entityIdList[i];
        if (!permissionGroupList.length) return;

        // Assign permission groups to entity
        return addAssignedPermissionGroupList(
          context,
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
