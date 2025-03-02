import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {LiteralDataQuery} from '../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {convertToArray} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {UnassignPermissionGroupsEndpoint} from './types.js';
import {unassignPermissionGroupsJoiSchema} from './validation.js';

const unassignPermissionGroups: UnassignPermissionGroupsEndpoint =
  async reqData => {
    const data = validate(reqData.data, unassignPermissionGroupsJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
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
      convertToArray(data.permissionGroupId).forEach(pId => {
        queries.push({assignedItemId: pId, assigneeId: entityId});
      });
    });

    await kIjxSemantic.utils().withTxn(async opts => {
      // TODO: use $or query when we implement $or
      await Promise.all(
        queries.map(q => kIjxSemantic.assignedItem().deleteManyByQuery(q, opts))
      );
    });
  };

export default unassignPermissionGroups;
