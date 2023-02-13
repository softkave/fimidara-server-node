import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';
import EndpointReusableQueries from '../queries';

export async function checkProgramTokenNameExists(context: IBaseContext, workspaceId: string, name: string) {
  const itemExists = await context.data.programAccessToken.existsByQuery(
    EndpointReusableQueries.getByWorkspaceIdAndName(workspaceId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Program access token exists');
  }
}
