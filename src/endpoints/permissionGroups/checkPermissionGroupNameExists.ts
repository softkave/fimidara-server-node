import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';
import PermissionGroupQueries from './queries';

export async function checkPermissionGroupNameExists(
  context: IBaseContext,
  workspaceId: string,
  name: string
) {
  const itemExists = await context.data.permissiongroup.checkItemExists(
    PermissionGroupQueries.getByWorkspaceAndName(workspaceId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }
}
