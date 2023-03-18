import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';

export async function checkAgentTokenNameExists(
  context: IBaseContext,
  workspaceId: string,
  name: string,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const itemExists = await context.semantic.agentToken.existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Program access token exists.');
  }
}
