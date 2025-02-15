import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';

export async function checkWorkspaceNameExists(params: {
  name: string;
  workspaceId?: string;
  opts?: SemanticProviderOpParams;
}) {
  const {name, workspaceId, opts} = params;
  const workspace = await kSemanticModels
    .workspace()
    .getByWorkspaceName(name, {...opts, projection: {resourceId: true}});

  if (workspace && workspace.resourceId !== workspaceId) {
    throw kReuseableErrors.workspace.workspaceExists();
  }
}

export async function checkWorkspaceRootnameExists(params: {
  rootname: string;
  workspaceId?: string;
  opts?: SemanticProviderOpParams;
}) {
  const {rootname, workspaceId, opts} = params;
  const workspace = await kSemanticModels
    .workspace()
    .getByRootname(rootname, {...opts, projection: {resourceId: true}});

  if (workspace && workspace.resourceId !== workspaceId) {
    throw kReuseableErrors.workspace.workspaceExists();
  }
}
