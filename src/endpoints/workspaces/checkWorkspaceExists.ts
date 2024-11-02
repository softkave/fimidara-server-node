import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from './errors.js';

export async function checkWorkspaceNameExists(
  params: {name: string; workspaceId?: string | null},
  opts?: SemanticProviderOpParams
) {
  const workspaceExists = await kSemanticModels
    .workspace()
    .workspaceExistsByName(params, opts);

  if (workspaceExists) {
    throw new WorkspaceExistsError();
  }
}

export async function checkWorkspaceRootnameExists(
  params: {rootname: string; workspaceId?: string | null},
  opts?: SemanticProviderOpParams
) {
  const workspaceExists = await kSemanticModels
    .workspace()
    .existsByRootname(params, opts);

  if (workspaceExists) {
    throw new WorkspaceRootnameExistsError();
  }
}
