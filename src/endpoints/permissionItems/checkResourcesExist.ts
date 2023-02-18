import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {IBaseContext} from '../contexts/types';
import {getResources, IFetchResourceItemWithAction} from '../resources/getResources';
import {checkResourcesBelongToWorkspace} from '../resources/isPartOfOrganization';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';

export default async function checkPermissionTargetsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  items: Array<string>
) {
  /**
   * TODO:
   * - check that they belong to the containers and unique container, action, resource
   */

  let resources = await getResources({
    context,
    agent,
    workspace,
    inputResources: items.map(id => {
      const fetchResourceItem: IFetchResourceItemWithAction = {
        resourceId: id,
        resourceType: getResourceTypeFromId(id),
      };
      return fetchResourceItem;
    }),
    checkAuth: true,
  });
  resources = await resourceListWithAssignedItems(context, workspace.resourceId, resources, [
    AppResourceType.User,
  ]);
  checkResourcesBelongToWorkspace(workspace.resourceId, resources);
  return {resources};
}
