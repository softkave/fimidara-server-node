import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAgent} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import PermissionItemQueries from '../queries';
import {compactPermissionItems, permissionItemIndexer} from '../utils';
import {IReplacePermissionItemsByResourceParams} from './types';

export async function internalReplacePermissionItemsByResource(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByResourceParams
) {
  await context.data.permissionItem.deleteManyItems(
    PermissionItemQueries.getByOwnerAndResource(
      data.permissionOwnerId,
      data.permissionOwnerType,
      data.itemResourceType,
      data.itemResourceId
    )
  );

  let items: IPermissionItem[] = data.items.map(input => {
    const item: IPermissionItem = {
      ...input,
      resourceId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      organizationId: data.organizationId,
      permissionOwnerId: data.permissionOwnerId,
      permissionOwnerType: data.permissionOwnerType,
      itemResourceId: data.itemResourceId,
      itemResourceType: data.itemResourceType,
      hash: '',
    };

    item.hash = permissionItemIndexer(item);
    return item;
  });

  items = compactPermissionItems(items);
  await context.data.permissionItem.bulkSaveItems(items);
  return items;
}
