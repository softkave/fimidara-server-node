import {
  AppResourceType,
  AppResourceTypeMap,
  ResourceWrapper,
} from '../../definitions/system';
import {User} from '../../definitions/user';
import {indexArray} from '../../utils/indexArray';
import {
  populateAssignedTags,
  populateUserWorkspaces,
} from '../assignedItems/getAssignedItems';
import {BaseContextType} from '../contexts/types';

export async function resourceWithAssignedItems<T extends ResourceWrapper>(
  context: BaseContextType,
  workspaceId: string,
  resource: T
) {
  switch (resource.resourceType) {
    case AppResourceTypeMap.AgentToken:
    case AppResourceTypeMap.Folder:
    case AppResourceTypeMap.File:
    case AppResourceTypeMap.PermissionGroup:
      resource.resource = await populateAssignedTags(
        context,
        workspaceId,
        resource.resource
      );
      return resource;
    case AppResourceTypeMap.User:
      resource.resource = await populateUserWorkspaces(
        context,
        resource.resource as User
      );
      return resource;
    case AppResourceTypeMap.Workspace:
    case AppResourceTypeMap.CollaborationRequest:
    case AppResourceTypeMap.PermissionItem:
    default:
      return resource;
  }
}

export async function resourceListWithAssignedItems<T extends ResourceWrapper>(
  context: BaseContextType,
  workspaceId: string,
  resourceList: T[],
  forTypes: AppResourceType[] = Object.values(AppResourceTypeMap)
) {
  const forTypesMap = indexArray(forTypes);

  // TODO: can we do this together, like query all the assigned items once
  // instead of individually?
  return Promise.all(
    resourceList.map(item =>
      forTypesMap[item.resourceType]
        ? resourceWithAssignedItems(context, workspaceId, item)
        : item
    )
  );
}
