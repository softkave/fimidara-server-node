import {IBaseContext} from '../contexts/types';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from './errors';

export async function checkWorkspaceNameExists(context: IBaseContext, name: string) {
  const workspaceExists = await context.semantic.workspace.existsByName(name);
  if (workspaceExists) {
    throw new WorkspaceExistsError();
  }
}

export async function checkWorkspaceRootnameExists(context: IBaseContext, rootname: string) {
  const workspaceExists = await context.semantic.workspace.existsByRootname(rootname);
  if (workspaceExists) {
    throw new WorkspaceRootnameExistsError();
  }
}
