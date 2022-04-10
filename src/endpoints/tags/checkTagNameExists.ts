import {IBaseContext} from '../contexts/BaseContext';
import {ResourceExistsError} from '../errors';
import EndpointReusableQueries from '../queries';

export async function checkTagNameExists(
  context: IBaseContext,
  orgId: string,
  name: string
) {
  const itemExists = await context.data.tag.checkItemExists(
    EndpointReusableQueries.getByOrganizationAndName(orgId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Tag exists');
  }
}
