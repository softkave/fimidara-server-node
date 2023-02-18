import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';
import EndpointReusableQueries from '../queries';

export async function checkPermissionGroupNameExists(
  context: IBaseContext,
  workspaceId: string,
  name: string
) {
  const itemExists = await context.data.permissiongroup.existsByQuery(
    EndpointReusableQueries.getByWorkspaceIdAndName(workspaceId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }
}
