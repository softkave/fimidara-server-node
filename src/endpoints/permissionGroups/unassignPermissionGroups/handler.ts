import {AssignedItem} from '../../../definitions/assignedItem.js';
import {convertToArray} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {LiteralDataQuery} from '../../contexts/data/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {UnassignPermissionGroupsEndpoint} from './types.js';
import {unassignPermissionGroupsJoiSchema} from './validation.js';

const unassignPermissionGroups: UnassignPermissionGroupsEndpoint =
  async instData => {
    const data = validate(instData.data, unassignPermissionGroupsJoiSchema);
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

    const queries: LiteralDataQuery<AssignedItem>[] = [];
    convertToArray(data.entityId).forEach(entityId => {
      convertToArray(data.permissionGroups).forEach(pId => {
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

export default unassignPermissionGroups;
