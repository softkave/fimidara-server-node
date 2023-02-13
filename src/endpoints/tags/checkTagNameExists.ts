import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';
import EndpointReusableQueries from '../queries';

export async function checkTagNameExists(context: IBaseContext, workspaceId: string, name: string) {
  const itemExists = await context.data.tag.existsByQuery(
    EndpointReusableQueries.getByWorkspaceIdAndName(workspaceId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Tag exists');
  }
}
