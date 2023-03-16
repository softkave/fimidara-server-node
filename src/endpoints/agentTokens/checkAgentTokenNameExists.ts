import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';

export async function checkAgentTokenNameExists(
  context: IBaseContext,
  workspaceId: string,
  name: string
) {
  const itemExists = await context.semantic.agentToken.existsByName(workspaceId, name);
  if (itemExists) {
    throw new ResourceExistsError('Program access token exists.');
  }
}
