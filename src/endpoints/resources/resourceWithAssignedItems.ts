import {AppResourceType} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {indexArray} from '../../utilities/indexArray';
import {
  withAssignedPresetsAndTags,
  withUserOrganizations,
} from '../assignedItems/getAssignedItems';
import {IBaseContext} from '../contexts/BaseContext';
import {IResource} from './types';

export async function resourceWithAssignedItems(
  context: IBaseContext,
  organizationId: string,
  resource: IResource
) {
  switch (resource.resourceType) {
    case AppResourceType.ProgramAccessToken:
    case AppResourceType.Folder:
    case AppResourceType.File:
      resource.resource = await withAssignedPresetsAndTags(
        context,
        organizationId,
        resource.resource,
        resource.resourceType
      );
      return resource;
    case AppResourceType.User:
      resource.resource = await withUserOrganizations(
        context,
        resource.resource as IUser
      );
      return resource;
    case AppResourceType.Organization:
    case AppResourceType.CollaborationRequest:
    case AppResourceType.PermissionItem:
    case AppResourceType.ClientAssignedToken:
    case AppResourceType.PresetPermissionsGroup:
    case AppResourceType.UserToken:
    default:
      return resource;
  }
}

export async function resourceListWithAssignedItems(
  context: IBaseContext,
  organizationId: string,
  resourceList: IResource[],
  forTypes: AppResourceType[] = Object.values(AppResourceType)
) {
  const forTypesMap = indexArray(forTypes);
  return Promise.all(
    resourceList.map(item =>
      forTypesMap[item.resourceType]
        ? resourceWithAssignedItems(context, organizationId, item)
        : item
    )
  );
}
