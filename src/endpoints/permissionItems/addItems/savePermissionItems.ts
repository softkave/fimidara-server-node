import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAgent} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import PermissionItemQueries from '../queries';
import {compactPermissionItems} from '../utils';
import {IReplacePermissionItemsByEntityParams} from './types';

export async function savePermissionItems(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByEntityParams
) {
  if (data.items.length === 0) {
    // Bail early
    return [];
  }

  // TODO: this could be too expensive for presets with a lot
  // of permissions
  const existingPermissionItems =
    await context.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        data.permissionEntityId,
        data.permissionEntityType
      )
    );

  await context.data.permissionItem.deleteManyItems(
    PermissionItemQueries.getByPermissionEntity(
      data.permissionEntityId,
      data.permissionEntityType
    )
  );

  let items: IPermissionItem[] = data.items
    .map(input => {
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
      };

      return item;
    })
    .concat(existingPermissionItems);

  items = compactPermissionItems(items);
  await context.data.permissionItem.bulkSaveItems(items);
  return items;
}
