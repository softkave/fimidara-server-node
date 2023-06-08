import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from './errors';

export async function checkWorkspaceNameExists(
  context: BaseContextType,
  name: string,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const workspaceExists = await context.semantic.workspace.workspaceExistsByName(name, opts);
  if (workspaceExists) {
    throw new WorkspaceExistsError();
  }
}

export async function checkWorkspaceRootnameExists(
  context: BaseContextType,
  rootname: string,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const workspaceExists = await context.semantic.workspace.existsByRootname(rootname, opts);
  if (workspaceExists) {
    throw new WorkspaceRootnameExistsError();
  }
}
