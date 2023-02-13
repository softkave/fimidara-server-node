import {format} from 'util';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {getResources} from '../resources/getResources';
import {checkResourcesBelongToWorkspace} from '../resources/isPartOfOrganization';

interface IPermissionContainer {
  containerId: string;
  containerType: AppResourceType;
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
    if (!allowedTypes.has(item.containerType)) {
      const message = format('Invalid permission container type %s', item.containerType);

      throw new InvalidRequestError(message);
    }
  });

  const resources = await getResources({
    context,
    agent,
    workspace,
    inputResources: items.map(item => ({
      resourceId: item.containerId,
      resourceType: item.containerType,
    })),
    checkAuth: true,
  });

  checkResourcesBelongToWorkspace(
    workspace.resourceId,
    resources,
    // We only use workspaces, folders, and files in here
    true
  );

  return {resources};
}
