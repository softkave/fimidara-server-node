import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import PermissionItemQueries from '../queries';
import {compactPermissionItems, permissionItemIndexer} from '../utils';
import {IReplacePermissionItemsByEntityEndpointParams} from './types';

export async function internalAddPermissionItemsByEntity(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByEntityEndpointParams
) {
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  let items: IPermissionItem[] = data.items.map(input => {
    const item: IPermissionItem = {
      ...input,
      workspaceId,
      resourceId: getNewIdForResource(AppResourceType.PermissionItem),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      permissionEntityId: data.permissionEntityId,
      permissionEntityType: data.permissionEntityType,
      hash: '',
    };

    item.hash = permissionItemIndexer(item);
    return item;
  });

  items = compactPermissionItems(items);
  await context.data.permissionItem.insertList(items);
  return items;
}

export async function internalReplacePermissionItemsByEntity(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByEntityEndpointParams
) {
  await context.data.permissionItem.deleteManyByQuery(
    PermissionItemQueries.getByPermissionEntity(data.permissionEntityId, data.permissionEntityType)
  );

  return await internalAddPermissionItemsByEntity(context, agent, data);
}
