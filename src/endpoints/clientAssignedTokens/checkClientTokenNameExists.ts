import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';
import EndpointReusableQueries from '../queries';

export async function checkClientTokenNameExists(
  context: IBaseContext,
  workspaceId: string,
  name: string
) {
  const itemExists = await context.data.clientAssignedToken.checkItemExists(
    EndpointReusableQueries.getByWorkspaceAndName(workspaceId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Client assigned token exists');
  }
}
