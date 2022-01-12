import {ISessionAgent, AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';

interface IPermissionResource {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
}

export default async function checkResourcesExist(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  items: Array<IPermissionResource>,
  organizationChecked = false
) {
  /**
   * - get resources
   * - check auth
   * - check that they belong to the owners and unique owner, action, resource
   */
}

async function getResources(context: IBaseContext) {
  return false;
}
