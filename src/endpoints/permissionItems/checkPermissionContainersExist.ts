import {format} from 'util';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {getResources} from '../resources/getResources';
import {checkResourcesBelongToWorkspace} from '../resources/isPartOfOrganization';

interface IPermissionContainer {
  containerId: string;
}

const allowedTypes = new Map();
allowedTypes.set(AppResourceType.Workspace, true);
allowedTypes.set(AppResourceType.Folder, true);
allowedTypes.set(AppResourceType.File, true);

export default async function checkPermissionContainersExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  items: Array<IPermissionContainer>
) {
  items.forEach(item => {
    const containerType = getResourceTypeFromId(item.containerId);
    if (!allowedTypes.has(containerType)) {
      const message = format('Invalid permission container type %s', containerType);
      throw new InvalidRequestError(message);
    }
  });

  const resources = await getResources({
    context,
    agent,
    workspace,
    inputResources: items.map(item => {
      const containerType = getResourceTypeFromId(item.containerId);
      return {resourceId: item.containerId, resourceType: containerType};
    }),
    checkAuth: true,
  });
  checkResourcesBelongToWorkspace(workspace.resourceId, resources);
  return {resources};
}
