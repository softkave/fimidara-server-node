import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from './errors';

export async function checkWorkspaceNameExists(
  context: IBaseContext,
  name: string,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const workspaceExists = await context.semantic.workspace.workspaceExistsByName(name, opts);
  if (workspaceExists) {
    throw new WorkspaceExistsError();
  }
}

export async function checkWorkspaceRootnameExists(
  context: IBaseContext,
  rootname: string,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const workspaceExists = await context.semantic.workspace.existsByRootname(rootname, opts);
  if (workspaceExists) {
    throw new WorkspaceRootnameExistsError();
  }
}
