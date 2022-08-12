import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {getNewIdForResource} from '../../../utilities/resourceId';
import {IBaseContext} from '../../contexts/BaseContext';
import {getWorkspaceId} from '../../contexts/SessionContext';
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
  await context.data.permissionItem.bulkSaveItems(items);
  return items;
}

export async function internalReplacePermissionItemsByEntity(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByEntityEndpointParams
) {
  await context.data.permissionItem.deleteManyItems(
    PermissionItemQueries.getByPermissionEntity(
      data.permissionEntityId,
      data.permissionEntityType
    )
  );

  return await internalAddPermissionItemsByEntity(context, agent, data);
}
