import {IBaseContext} from '../contexts/types';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from './errors';
import WorkspaceQueries from './queries';

export async function checkWorkspaceNameExists(context: IBaseContext, name: string) {
  const workspaceExists = await context.data.workspace.existsByQuery(WorkspaceQueries.getByName(name));
  if (workspaceExists) {
    throw new WorkspaceExistsError();
  }
}

export async function checkWorkspaceRootnameExists(context: IBaseContext, rootname: string) {
  const workspaceExists = await context.data.workspace.existsByQuery(WorkspaceQueries.getByRootname(rootname));
  if (workspaceExists) {
    throw new WorkspaceRootnameExistsError();
  }
}
