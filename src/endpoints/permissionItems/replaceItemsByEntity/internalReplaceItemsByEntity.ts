import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAgent} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import PermissionItemQueries from '../queries';
import {compactPermissionItems, permissionItemIndexer} from '../utils';
import {IReplacePermissionItemsByEntityParams} from './types';

export async function internalReplacePermissionItemsByEntity(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByEntityParams
) {
  await context.data.permissionItem.deleteManyItems(
    PermissionItemQueries.getByPermissionEntity(
      data.permissionEntityId,
      data.permissionEntityType
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
