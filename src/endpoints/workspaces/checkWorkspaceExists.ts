import {kSemanticModels} from '../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../contexts/semantic/types.js';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from './errors.js';

export async function checkWorkspaceNameExists(
  name: string,
  opts?: SemanticProviderOpParams
) {
  const workspaceExists = await kSemanticModels
    .workspace()
    .workspaceExistsByName(name, opts);

  if (workspaceExists) {
    throw new WorkspaceExistsError();
  }
}

export async function checkWorkspaceRootnameExists(
  rootname: string,
  opts?: SemanticProviderOpParams
) {
  const workspaceExists = await kSemanticModels
    .workspace()
    .existsByRootname(rootname, opts);

  if (workspaceExists) {
    throw new WorkspaceRootnameExistsError();
  }
}
