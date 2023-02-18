import {
  IAssignedItem,
  IAssignedItemAssignedPermissionGroupMeta,
} from '../../../definitions/assignedItem';
import {
  IAssignedPermissionGroupMeta,
  IPermissionGroupWithAssignedPermissionGroups,
} from '../../../definitions/permissionGroups';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IAssignedItemQuery} from '../../contexts/data/assigneditem/type';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';

export async function checkReadEntityAssignedPermissionGroups(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  entityId: string
) {
  if (isFetchingOwnPermissionGroups(agent, entityId)) {
    return true;
  } else {
    await checkAuthorization({
      context,
      agent,
      workspace,
      action: BasicCRUDActions.Read,
      targetId: entityId,
      type: AppResourceType.PermissionGroup,
      permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    });
    return true;
  }
}

export function isFetchingOwnPermissionGroups(agent: ISessionAgent, entityId: string) {
  return agent.agentId === entityId;
}

export async function fetchEntityAssignedPermissionGroupIdInheritanceMap(
  context: IBaseContext,
  workspaceId: string,
  entityId: string,
  includeInheritedPermissionGroups = true
) {
  const idInheritanceMap: Record<string, IAssignedPermissionGroupMeta[]> = {};
  let nextEntityIdList = [entityId];
  const maxDepth = includeInheritedPermissionGroups ? 1 : 10;
  for (let depth = 0; nextEntityIdList.length && depth < maxDepth; depth++) {
    const query: IAssignedItemQuery<IAssignedItemAssignedPermissionGroupMeta> = {
      workspaceId: workspaceId,
      assignedItemType: AppResourceType.PermissionGroup,
      assignedToItemId: {$in: nextEntityIdList},
    };
    const assignedItems = await context.data.assignedItem.getManyByQuery(query);
    const iterationPermissionGroupIdList = assignedItems.map(item => item.assignedItemId);
    const iterationAssignedItemMeta = assignedItems.map(item => {
      const assignedPermissionGroup: IAssignedPermissionGroupMeta = {
        assignedAt: item.assignedAt,
        assignedBy: item.assignedBy,
        permissionGroupId: item.assignedToItemId,
        order: (item as IAssignedItem<IAssignedItemAssignedPermissionGroupMeta>).meta.order,
      };
      return assignedPermissionGroup;
    });
    nextEntityIdList.forEach(id => {
      idInheritanceMap[id] = iterationAssignedItemMeta;
    });
    nextEntityIdList = iterationPermissionGroupIdList.filter(id => {
      // Remove already fetched assigned items to avoid recursion. This should
      // be mitigated seeign we have a max depth but it's still best to avoid it
      // this way too.
      return !idInheritanceMap[id];
    });
  }

  return idInheritanceMap;
}

export async function fetchEntityAssignedPermissionGroupList(
  context: IBaseContext,
  workspaceId: string,
  entityId: string,
  includeInheritedPermissionGroups = true
) {
  const idInheritanceMap = await fetchEntityAssignedPermissionGroupIdInheritanceMap(
    context,
    workspaceId,
    entityId,
    includeInheritedPermissionGroups
  );
  const idList = Object.keys(idInheritanceMap).filter(id => {
    // Remove the entity's ID itself since we're only fetching it's assigned
    // permission groups
    return id !== entityId;
  });
  const query = EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(workspaceId, idList);
  const plainPermissionGroups = await context.data.permissiongroup.getManyByQuery(query);
  const permissionGroupsWithAssignedItems = plainPermissionGroups.map(
    (permissionGroup): IPermissionGroupWithAssignedPermissionGroups => ({
      ...permissionGroup,
      assignedPermissionGroupsMeta: idInheritanceMap[permissionGroup.resourceId],
    })
  );
  const immediatelyAssignedPermissionGroupsMeta = idInheritanceMap[entityId];
  return {permissionGroupsWithAssignedItems, immediatelyAssignedPermissionGroupsMeta};
}
