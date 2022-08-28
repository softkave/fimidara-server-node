import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType} from '../../../definitions/system';
import {getResourceAssignedItemsSortedByType} from '../../assignedItems/getAssignedItems';
import {assignedItemsToAssignedPermissionGroupList} from '../../assignedItems/utils';
import {IBaseContext} from '../../contexts/types';

export const internalGetEntityAssignedPermissionGroups = async (
  context: IBaseContext,
  workspaceId: string,
  entity: Pick<IPermissionItem, 'permissionEntityId' | 'permissionEntityType'>
) => {
  const assignedItemsMap = await getResourceAssignedItemsSortedByType(
    context,
    workspaceId,
    entity.permissionEntityId,
    entity.permissionEntityType,
    [AppResourceType.PermissionGroup]
  );

  const assignedPermissionGroups = assignedItemsToAssignedPermissionGroupList(
    assignedItemsMap[AppResourceType.PermissionGroup]
  );

  return assignedPermissionGroups;
};
