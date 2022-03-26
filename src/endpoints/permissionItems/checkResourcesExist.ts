import {IOrganization} from '../../definitions/organization';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import {getResources, IGetResourcesOptions} from '../resources/getResources';
import {checkNotOrganizationResources} from '../resources/isPartOfOrganization';

interface IPermissionResource {
  // permissionOwnerId: string;
  // permissionOwnerType: AppResourceType;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
}

export default async function checkResourcesExist(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  items: Array<IPermissionResource>
) {
  /**
   * TODO:
   * - check that they belong to the owners and unique owner, action, resource
   */

  const resources = await getResources({
    context,
    agent,
    organization,
    inputResources: items.reduce((list, item) => {
      if (item.itemResourceId) {
        list.push({
          resourceId: item.itemResourceId,
          resourceType: item.itemResourceType,
        });
      }

      return list;
    }, [] as IGetResourcesOptions['inputResources']),
    checkAuth: true,
  });

  checkNotOrganizationResources(organization.resourceId, resources);
}
