import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {ResourceExistsError} from '../errors';

export async function checkAgentTokenNameExists(
  context: BaseContextType,
  workspaceId: string,
  name: string,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const itemExists = await context.semantic.agentToken.existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Agent token exists.');
  }
}
