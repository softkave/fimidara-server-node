import {IBaseContext} from '../contexts/BaseContext';
import {WorkspaceExistsError} from './errors';
import WorkspaceQueries from './queries';

export async function checkWorkspaceNameExists(
  context: IBaseContext,
  name: string
) {
  const workspaceExists = await context.data.workspace.checkItemExists(
    WorkspaceQueries.getByName(name)
  );

  if (workspaceExists) {
    throw new WorkspaceExistsError();
  }
}
