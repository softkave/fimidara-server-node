import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {IBaseContext} from '../contexts/types';
import {getResources, IGetResourcesOptions} from '../resources/getResources';
import {checkResourcesBelongToWorkspace} from '../resources/isPartOfOrganization';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';

interface IPermissionResource {
  targetId?: string;
  targetType: AppResourceType;
}

export default async function checkPermissionTargetsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  items: Array<IPermissionResource>
) {
  /**
   * TODO:
   * - check that they belong to the containers and unique container, action, resource
   */

  let resources = await getResources({
    context,
    agent,
    workspace,
    inputResources: items.reduce((list, item) => {
      if (item.targetId) {
        list.push({resourceId: item.targetId, resourceType: item.targetType});
      }
      return list;
    }, [] as IGetResourcesOptions['inputResources']),
    checkAuth: true,
  });

  resources = await resourceListWithAssignedItems(context, workspace.resourceId, resources, [
    AppResourceType.User,
  ]);
  checkResourcesBelongToWorkspace(workspace.resourceId, resources, true);
  return {resources};
}
