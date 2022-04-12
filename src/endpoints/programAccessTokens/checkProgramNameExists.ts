import {IBaseContext} from '../contexts/BaseContext';
import {ResourceExistsError} from '../errors';
import EndpointReusableQueries from '../queries';

export async function checkProgramTokenNameExists(
  context: IBaseContext,
  orgId: string,
  name: string
) {
  const itemExists = await context.data.programAccessToken.checkItemExists(
    EndpointReusableQueries.getByOrganizationAndName(orgId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Program access token exists');
  }
}