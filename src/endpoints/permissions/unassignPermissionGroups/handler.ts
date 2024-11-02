import {LiteralDataQuery} from '../../../contexts/data/types.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {convertToArray} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {UnassignPermissionGroupsEndpoint} from './types.js';
import {unassignPermissionGroupsJoiSchema} from './validation.js';

const unassignPermissionGroupsEndpoint: UnassignPermissionGroupsEndpoint =
  async reqData => {
    const data = validate(reqData.data, unassignPermissionGroupsJoiSchema);
    await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.updatePermission,
    });

    const queries: LiteralDataQuery<AssignedItem>[] = [];
    convertToArray(data.entityId).forEach(entityId => {
      convertToArray(data.permissionGroupId).forEach(pId => {
        queries.push({assignedItemId: pId, assigneeId: entityId});
      });
    });

    await kSemanticModels.utils().withTxn(async opts => {
      // TODO: use $or query when we implement $or
      await Promise.all(
        queries.map(q =>
          kSemanticModels.assignedItem().deleteManyByQuery(q, opts)
        )
      );
    });
  };

export default unassignPermissionGroupsEndpoint;
