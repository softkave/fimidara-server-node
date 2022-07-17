import {IBaseContext} from '../contexts/BaseContext';
import {WorkspaceExistsError, WorkspaceRootNameExistsError} from './errors';

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

export async function checkWorkspaceRootNameExists(
  context: IBaseContext,
  rootname: string
) {
  const workspaceExists =
    await context.cacheProviders.workspace.existsByRootName(context, rootname);

  if (workspaceExists) {
    throw new WorkspaceRootNameExistsError();
  }
}
