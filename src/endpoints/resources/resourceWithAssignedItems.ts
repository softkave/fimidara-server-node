import {AppResourceType, ResourceWrapper} from '../../definitions/system';
import {User} from '../../definitions/user';
import {indexArray} from '../../utils/indexArray';
import {populateAssignedTags, populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {BaseContextType} from '../contexts/types';

export async function resourceWithAssignedItems(
  context: BaseContextType,
  workspaceId: string,
  resource: ResourceWrapper
) {
  switch (resource.resourceType) {
    case AppResourceType.AgentToken:
    case AppResourceType.Folder:
    case AppResourceType.File:
    case AppResourceType.PermissionGroup:
      resource.resource = await populateAssignedTags(context, workspaceId, resource.resource);
      return resource;
    case AppResourceType.User:
      resource.resource = await populateUserWorkspaces(context, resource.resource as User);
      return resource;
    case AppResourceType.Workspace:
    case AppResourceType.CollaborationRequest:
    case AppResourceType.PermissionItem:
    default:
      return resource;
  }
}

export async function resourceListWithAssignedItems(
  context: BaseContextType,
  workspaceId: string,
  resourceList: ResourceWrapper[],
  forTypes: AppResourceType[] = Object.values(AppResourceType)
) {
  const forTypesMap = indexArray(forTypes);

  // TODO: can we do this together, like query all the assigned items once
  // instead of individually?
  return Promise.all(
    resourceList.map(item =>
      forTypesMap[item.resourceType] ? resourceWithAssignedItems(context, workspaceId, item) : item
    )
  );
}
