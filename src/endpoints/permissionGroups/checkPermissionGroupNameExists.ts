import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';

export async function checkPermissionGroupNameExists(
  context: IBaseContext,
  workspaceId: string,
  name: string,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const itemExists = await context.semantic.permissionGroup.existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }
}
