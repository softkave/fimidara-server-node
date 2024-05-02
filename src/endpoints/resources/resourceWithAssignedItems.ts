import {
  FimidaraResourceType,
  kFimidaraResourceType,
  ResourceWrapper,
} from '../../definitions/system.js';
import {User} from '../../definitions/user.js';
import {indexArray} from '../../utils/indexArray.js';
import {
  populateAssignedTags,
  populateUserWorkspaces,
} from '../assignedItems/getAssignedItems.js';

export async function resourceWithAssignedItems<T extends ResourceWrapper>(
  workspaceId: string,
  resource: T
) {
  switch (resource.resourceType) {
    case kFimidaraResourceType.AgentToken:
    case kFimidaraResourceType.Folder:
    case kFimidaraResourceType.File:
    case kFimidaraResourceType.PermissionGroup:
      resource.resource = await populateAssignedTags(workspaceId, resource.resource);
      return resource;
    case kFimidaraResourceType.User:
      resource.resource = await populateUserWorkspaces(resource.resource as User);
      return resource;
    case kFimidaraResourceType.Workspace:
    case kFimidaraResourceType.CollaborationRequest:
    case kFimidaraResourceType.PermissionItem:
    default:
      return resource;
  }
}

export async function resourceListWithAssignedItems<T extends ResourceWrapper>(
  workspaceId: string,
  resourceList: T[],
  forTypes: FimidaraResourceType[] = Object.values(kFimidaraResourceType)
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
