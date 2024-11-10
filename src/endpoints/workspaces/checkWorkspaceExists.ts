import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {ResourceExistsError} from '../errors.js';

export async function checkWorkspaceNameExists(
  params: {name: string; workspaceId?: string | null},
  opts?: SemanticProviderOpParams
) {
  const workspaceExists = await kSemanticModels
    .workspace()
    .workspaceExistsByName(params, opts);

  if (workspaceExists) {
    throw new ResourceExistsError('Workspace name not available');
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
    throw new ResourceExistsError('Workspace rootname not available');
  }
}
