import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAgent} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {getWorkspaceId} from '../../contexts/SessionContext';
import PermissionItemQueries from '../queries';
import {compactPermissionItems, permissionItemIndexer} from '../utils';
import {IReplacePermissionItemsByEntityEndpointParams} from './types';

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

  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  let items: IPermissionItem[] = data.items.map(input => {
    const item: IPermissionItem = {
      ...input,
      workspaceId,
      resourceId: getNewId(),
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
