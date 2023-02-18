import {AppResourceType} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {indexArray} from '../../utils/indexArray';
import {populateAssignedTags, populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {IBaseContext} from '../contexts/types';
import {IResource} from './types';

export async function resourceWithAssignedItems(
  context: IBaseContext,
  workspaceId: string,
  resource: IResource
) {
  switch (resource.resourceType) {
    case AppResourceType.ProgramAccessToken:
    case AppResourceType.Folder:
    case AppResourceType.File:
    case AppResourceType.ClientAssignedToken:
    case AppResourceType.PermissionGroup:
      resource.resource = await populateAssignedTags(context, workspaceId, resource.resource);
      return resource;
    case AppResourceType.User:
      resource.resource = await populateUserWorkspaces(context, resource.resource as IUser);
      return resource;
    case AppResourceType.Workspace:
    case AppResourceType.CollaborationRequest:
    case AppResourceType.PermissionItem:
    case AppResourceType.UserToken:
    default:
      return resource;
  }
}

export async function resourceListWithAssignedItems(
  context: IBaseContext,
  workspaceId: string,
  resourceList: IResource[],
  forTypes: AppResourceType[] = Object.values(AppResourceType)
) {
  const forTypesMap = indexArray(forTypes);
  return Promise.all(
    resourceList.map(item =>
      forTypesMap[item.resourceType] ? resourceWithAssignedItems(context, workspaceId, item) : item
    )
  );
}
