import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';

export async function checkPermissionGroupNameExists(
  context: IBaseContext,
  workspaceId: string,
  name: string
) {
  const itemExists = await context.semantic.permissionGroup.existsByName(workspaceId, name);
  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }
}
