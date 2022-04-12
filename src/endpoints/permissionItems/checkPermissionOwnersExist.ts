import {format} from 'util';
import {IWorkspace} from '../../definitions/workspace';
import {ISessionAgent, AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError} from '../errors';
import {getResources} from '../resources/getResources';
import {checkNotWorkspaceResources} from '../resources/isPartOfWorkspace';

interface IPermissionOwner {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
}

const allowedTypes = new Map();
allowedTypes.set(AppResourceType.Workspace, true);
allowedTypes.set(AppResourceType.Folder, true);
allowedTypes.set(AppResourceType.File, true);

export default async function checkPermissionOwnersExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  items: Array<IPermissionOwner>
) {
  items.forEach(item => {
    if (!allowedTypes.has(item.permissionOwnerType)) {
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
    workspace,
    inputResources: items.map(item => ({
      resourceId: item.permissionOwnerId,
      resourceType: item.permissionOwnerType,
    })),
    checkAuth: true,
  });

  checkNotWorkspaceResources(
    workspace.resourceId,
    resources,
    // We only use workspaces, folders, and files in here
    true
  );

  return {resources};
}
