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

export async function resourceWithAssignedItems<T extends ResourceWrapper>(
  workspaceId: string,
  resource: T
) {
  switch (resource.resourceType) {
    case AppResourceTypeMap.AgentToken:
    case AppResourceTypeMap.Folder:
    case AppResourceTypeMap.File:
    case AppResourceTypeMap.PermissionGroup:
      resource.resource = await populateAssignedTags(workspaceId, resource.resource);
      return resource;
    case AppResourceTypeMap.User:
      resource.resource = await populateUserWorkspaces(resource.resource as User);
      return resource;
    case AppResourceTypeMap.Workspace:
    case AppResourceTypeMap.CollaborationRequest:
    case AppResourceTypeMap.PermissionItem:
    default:
      return resource;
  }
}

export async function resourceListWithAssignedItems<T extends ResourceWrapper>(
  workspaceId: string,
  resourceList: T[],
  forTypes: AppResourceType[] = Object.values(AppResourceTypeMap)
) {
  const forTypesMap = indexArray(forTypes);

  // TODO: can we do this together, like query all the assigned items once
  // instead of individually?
  return Promise.all(
    resourceList.map(item =>
      forTypesMap[item.resourceType] ? resourceWithAssignedItems(workspaceId, item) : item
    )
  );
}
