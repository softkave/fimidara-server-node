import {format} from 'util';
import {IOrganization} from '../../definitions/organization';
import {ISessionAgent, AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError} from '../errors';
import {getResources} from '../resources/getResources';
import {checkNotOrganizationResources} from '../resources/isPartOfOrganization';

interface IPermissionOwner {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
}

const allowedTypes = new Map();
allowedTypes.set(AppResourceType.Organization, true);
allowedTypes.set(AppResourceType.Folder, true);
allowedTypes.set(AppResourceType.File, true);

export default async function checkPermissionOwnersExist(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  items: Array<IPermissionOwner>
) {
  items.forEach(item => {
    if (allowedTypes.has(item.permissionOwnerType)) {
      const message = format(
        'Invalid permission owner type %s',
        item.permissionOwnerType
      );

      throw new InvalidRequestError(message);
    }
  });

  const resources = await getResources({
    context,
    agent,
    organization,
    inputResources: items.map(item => ({
      resourceId: item.permissionOwnerId,
      resourceType: item.permissionOwnerType,
    })),
    checkAuth: true,
  });

  checkNotOrganizationResources(organization.resourceId, resources);
}
