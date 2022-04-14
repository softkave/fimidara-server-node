import {IWorkspace} from '../../definitions/workspace';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import {getResources, IGetResourcesOptions} from '../resources/getResources';
import {checkNotWorkspaceResources} from '../resources/isPartOfOrganization';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';

interface IPermissionResource {
  itemResourceId?: string;
  itemResourceType: AppResourceType;
}

export default async function checkResourcesExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  items: Array<IPermissionResource>
) {
  /**
   * TODO:
   * - check that they belong to the owners and unique owner, action, resource
   */

  let resources = await getResources({
    context,
    agent,
    workspace,
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

  resources = await resourceListWithAssignedItems(
    context,
    workspace.resourceId,
    resources,
    [AppResourceType.User] // Limit to users only
  );

  checkNotWorkspaceResources(workspace.resourceId, resources, true);
  return {resources};
}
