import {AssignedItem} from '../../../definitions/assignedItem';
import {AppActionType, AppResourceType} from '../../../definitions/system';
import {toArray} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {LiteralDataQuery} from '../../contexts/data/types';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {UnassignPermissionGroupsEndpoint} from './types';
import {unassignPermissionGroupsJoiSchema} from './validation';

const unassignPermissionGroups: UnassignPermissionGroupsEndpoint = async (context, instData) => {
  const data = validate(instData.data, unassignPermissionGroupsJoiSchema);
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

  const queries: LiteralDataQuery<AssignedItem>[] = [];
  toArray(data.entityId).forEach(entityId => {
    toArray(data.permissionGroups).forEach(pId => {
      queries.push({assignedItemId: pId, assigneeId: entityId});
    });
  });

  await executeWithMutationRunOptions(context, async opts => {
    // TODO: use $or query when we implement $or
    await Promise.all(queries.map(q => context.semantic.assignedItem.deleteManyByQuery(q, opts)));
  });
};

export default unassignPermissionGroups;
