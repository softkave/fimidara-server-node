import {convertToArray} from 'softkave-js-utils';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems.js';
import {checkPermissionEntitiesExist} from '../../permissions/checkPermissionArtifacts.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkPermissionGroupsExist} from '../utils.js';
import {AssignPermissionGroupsEndpoint} from './types.js';
import {assignPermissionGroupsJoiSchema} from './validation.js';

const assignPermissionGroupsEndpoint: AssignPermissionGroupsEndpoint =
  async reqData => {
    const data = validate(reqData.data, assignPermissionGroupsJoiSchema);
    const {agent, getWorkspace} = await initEndpoint(reqData, {data});
    const workspace = await getWorkspace(
      kFimidaraPermissionActions.updatePermission
    );

    const entityIdList = convertToArray(data.entityId);
    const pgIdList = convertToArray(data.permissionGroupId);

    await Promise.all([
      await checkPermissionEntitiesExist(
        agent,
        workspace.resourceId,
        entityIdList,
        kFimidaraPermissionActions.updatePermission
      ),
      await checkPermissionGroupsExist(workspace.resourceId, pgIdList),
    ]);

    await kSemanticModels.utils().withTxn(async opts => {
      // TODO: getEntityAssignedPermissionGroups should support entity ID array

      // get entities' immediately existing permission groups to avoid assigning
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

      // filter out permission groups already assigned leaving the ones unassigned
      const unassignedPermissionGroupsByEntity = entityIdList.map(
        (entityId, i) => {
          const {inheritanceMap} = existingPermissionGroups[i];
          return pgIdList.filter(pgId => !inheritanceMap[pgId]);
        }
      );

      await Promise.all(
        unassignedPermissionGroupsByEntity.map((permissionGroupList, i) => {
          const entityId = entityIdList[i];
          if (!permissionGroupList.length) return;

          // assign permission groups to entity
          return addAssignedPermissionGroupList(
            agent,
            workspace.resourceId,
            permissionGroupList,
            entityId,
            /** deleteExisting */ false,
            /** skipPermissionGroupsExistCheck */ true,
            /** skipAuthCheck */ true,
            opts
          );
        })
      );
    });
  };

export default assignPermissionGroupsEndpoint;
