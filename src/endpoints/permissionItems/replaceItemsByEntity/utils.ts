import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {getNewIdForResource, getResourceTypeFromId} from '../../../utils/resourceId';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import PermissionItemQueries from '../queries';
import {compactPermissionItems, getTargetType, permissionItemIndexer} from '../utils';
import {IReplacePermissionItemsByEntityEndpointParams} from './types';

export async function internalFunctionAddPermissionItemsByEntity(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByEntityEndpointParams
) {
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  let items: IPermissionItem[] = data.items.map(input => {
    const containerType = getResourceTypeFromId(input.containerId);
    const permissionEntityType = getResourceTypeFromId(data.entityId);
    const targetType = getTargetType(input);
    const item: IPermissionItem = {
      ...input,
      containerType,
      entityType: permissionEntityType,
      targetType,
      workspaceId,
      resourceId: getNewIdForResource(AppResourceType.PermissionItem),
      createdAt: getTimestamp(),
      createdBy: {agentId: agent.agentId, agentType: agent.agentType},
      entityId: data.entityId,
      hash: '',
    };

    item.hash = permissionItemIndexer(item);
    return item;
  });

  items = compactPermissionItems(items);
  await context.semantic.permissionItem.insertList(items);
  return items;
}

export async function internalFunctionReplacePermissionItemsByEntity(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByEntityEndpointParams
) {
  await context.semantic.permissionItem.deleteManyByQuery(
    PermissionItemQueries.getByPermissionEntity(data.entityId)
  );
  return await internalFunctionAddPermissionItemsByEntity(context, agent, data);
}
