import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderTxnOptions} from '../contexts/semantic/types';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from './errors';

export async function checkWorkspaceNameExists(
  name: string,
  opts?: SemanticProviderTxnOptions
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
  opts?: SemanticProviderTxnOptions
) {
  const workspaceExists = await kSemanticModels
    .workspace()
    .existsByRootname(rootname, opts);

  if (workspaceExists) {
    throw new WorkspaceRootnameExistsError();
  }
}
