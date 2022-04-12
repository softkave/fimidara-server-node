import {IBaseContext} from '../contexts/BaseContext';
import {ResourceExistsError} from '../errors';
import EndpointReusableQueries from '../queries';

export async function checkClientTokenNameExists(
  context: IBaseContext,
  orgId: string,
  name: string
) {
  const itemExists = await context.data.clientAssignedToken.checkItemExists(
    EndpointReusableQueries.getByOrganizationAndName(orgId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Client assigned token exists');
  }
}
