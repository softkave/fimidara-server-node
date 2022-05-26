import {IBaseContext} from '../contexts/BaseContext';
import {WorkspaceExistsError} from './errors';

export async function checkWorkspaceNameExists(
  context: IBaseContext,
  name: string
) {
  const workspaceExists = await context.cacheProviders.workspace.existsByName(
    context,
    name
  );

  if (workspaceExists) {
    throw new WorkspaceExistsError();
  }
}
