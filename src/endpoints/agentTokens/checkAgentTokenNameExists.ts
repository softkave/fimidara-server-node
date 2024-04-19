import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderOpParams} from '../contexts/semantic/types';
import {ResourceExistsError} from '../errors';

export async function checkAgentTokenNameExists(
  workspaceId: string,
  name: string,
  opts?: SemanticProviderOpParams
) {
  const itemExists = await kSemanticModels
    .agentToken()
    .existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Agent token exists');
  }
}
