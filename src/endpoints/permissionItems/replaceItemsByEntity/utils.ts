import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
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
    const permissionEntityType = getResourceTypeFromId(data.permissionEntityId);
    const targetType = getTargetType(input);
    const item: IPermissionItem = {
      ...input,
      containerType,
      permissionEntityType,
      targetType,
      workspaceId,
      resourceId: getNewIdForResource(AppResourceType.PermissionItem),
      createdAt: getDateString(),
      createdBy: {agentId: agent.agentId, agentType: agent.agentType},
      permissionEntityId: data.permissionEntityId,
      hash: '',
    };

    item.hash = permissionItemIndexer(item);
    return item;
  });

  items = compactPermissionItems(items);
  await context.data.permissionItem.insertList(items);
  return items;
}

export async function internalFunctionReplacePermissionItemsByEntity(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByEntityEndpointParams
) {
  await context.data.permissionItem.deleteManyByQuery(
    PermissionItemQueries.getByPermissionEntity(data.permissionEntityId)
  );
  return await internalFunctionAddPermissionItemsByEntity(context, agent, data);
}
