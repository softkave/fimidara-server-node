import {format} from 'util';
import {IWorkspace} from '../../definitions/workspace';
import {ISessionAgent, AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError} from '../errors';
import {getResources} from '../resources/getResources';
import {checkNotWorkspaceResources} from '../resources/isPartOfWorkspace';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';

/**
 * Entity auth check is enough for permission items cause
 * permission items are basically extensions of the entites
 * and are considered to belong to the entities.
 */

const allowedTypes = new Map();
allowedTypes.set(AppResourceType.ClientAssignedToken, true);
allowedTypes.set(AppResourceType.ProgramAccessToken, true);
allowedTypes.set(AppResourceType.PresetPermissionsGroup, true);
allowedTypes.set(AppResourceType.User, true);

export default async function checkEntitiesExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  entities: Array<{
    permissionEntityId: string;
    permissionEntityType: AppResourceType;
  }>
) {
  entities.forEach(item => {
    if (!allowedTypes.has(item.permissionEntityType)) {
      const message = format(
        'Invalid permission entity type %s',
        item.permissionEntityType
      );

      throw new InvalidRequestError(message);
    }
  });

  let resources = await getResources({
    context,
    agent,
    workspace,
    inputResources: entities.map(item => ({
      resourceId: item.permissionEntityId,
      resourceType: item.permissionEntityType,
    })),
    checkAuth: true,
  });

  resources = await resourceListWithAssignedItems(
    context,
    workspace.resourceId,
    resources,
    [AppResourceType.User] // Limit to users only
  );

  checkNotWorkspaceResources(workspace.resourceId, resources, true);
}
