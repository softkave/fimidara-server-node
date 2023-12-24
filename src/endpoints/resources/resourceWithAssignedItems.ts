import {
  AppResourceType,
  kAppResourceType,
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
    case kAppResourceType.AgentToken:
    case kAppResourceType.Folder:
    case kAppResourceType.File:
    case kAppResourceType.PermissionGroup:
      resource.resource = await populateAssignedTags(workspaceId, resource.resource);
      return resource;
    case kAppResourceType.User:
      resource.resource = await populateUserWorkspaces(resource.resource as User);
      return resource;
    case kAppResourceType.Workspace:
    case kAppResourceType.CollaborationRequest:
    case kAppResourceType.PermissionItem:
    default:
      return resource;
  }
}

export async function resourceListWithAssignedItems<T extends ResourceWrapper>(
  workspaceId: string,
  resourceList: T[],
  forTypes: AppResourceType[] = Object.values(kAppResourceType)
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
