import {format} from 'util';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {getResources} from '../resources/getResources';
import {checkResourcesBelongToWorkspace} from '../resources/isPartOfOrganization';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';

/**
 * Entity auth check is enough for permission items cause
 * permission items are basically extensions of the entites
 * and are considered to belong to the entities.
 */

const allowedTypes = new Map();
allowedTypes.set(AppResourceType.ClientAssignedToken, true);
allowedTypes.set(AppResourceType.ProgramAccessToken, true);
allowedTypes.set(AppResourceType.PermissionGroup, true);
allowedTypes.set(AppResourceType.User, true);

export default async function checkEntitiesExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  entities: Array<string>
) {
  if (entities.length === 0) {
    return;
  }

  entities.forEach(id => {
    const itemType = getResourceTypeFromId(id);
    if (!allowedTypes.has(itemType)) {
      const message = format('Invalid permission entity type %s', itemType);
      throw new InvalidRequestError(message);
    }
  });

  let resources = await getResources({
    context,
    agent,
    workspace,
    inputResources: entities.map(id => ({
      resourceId: id,
      resourceType: getResourceTypeFromId(id),
    })),
    checkAuth: true,
  });
  resources = await resourceListWithAssignedItems(
    context,
    workspace.resourceId,
    resources,
    // Only add assigned items for users since. We're going to check if all the
    // resources returned are part of the workspace and every other type should
    // have a workspaceId except user.
    [AppResourceType.User]
  );
  checkResourcesBelongToWorkspace(workspace.resourceId, resources);
}
