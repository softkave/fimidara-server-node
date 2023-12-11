import {kSemanticModels} from '../contexts/injectables';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {ResourceExistsError} from '../errors';

export async function checkAgentTokenNameExists(
  workspaceId: string,
  name: string,
  opts?: SemanticProviderRunOptions
) {
  const itemExists = await kSemanticModels
    .agentToken()
    .existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Agent token exists.');
  }
}
