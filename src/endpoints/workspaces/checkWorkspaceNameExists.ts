import {IBaseContext} from '../contexts/BaseContext';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from './errors';

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

export async function checkWorkspaceRootnameExists(
  context: IBaseContext,
  rootname: string
) {
  const workspaceExists =
    await context.cacheProviders.workspace.existsByRootname(context, rootname);

  if (workspaceExists) {
    throw new WorkspaceRootnameExistsError();
  }
}
