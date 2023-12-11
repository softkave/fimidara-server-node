import {AssignedItem} from '../../../definitions/assignedItem';
import {toArray} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {LiteralDataQuery} from '../../contexts/data/types';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {UnassignPermissionGroupsEndpoint} from './types';
import {unassignPermissionGroupsJoiSchema} from './validation';

const unassignPermissionGroups: UnassignPermissionGroupsEndpoint = async instData => {
  const data = validate(instData.data, unassignPermissionGroupsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'updatePermission'},
  });

  const queries: LiteralDataQuery<AssignedItem>[] = [];
  toArray(data.entityId).forEach(entityId => {
    toArray(data.permissionGroups).forEach(pId => {
      queries.push({assignedItemId: pId, assigneeId: entityId});
    });
  });

  await kSemanticModels.utils().withTxn(async opts => {
    // TODO: use $or query when we implement $or
    await Promise.all(
      queries.map(q => kSemanticModels.assignedItem().deleteManyByQuery(q, opts))
    );
  });
};

export default unassignPermissionGroups;
