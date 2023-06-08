import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {ResourceExistsError} from '../errors';

export async function checkTagNameExists(
  context: BaseContextType,
  workspaceId: string,
  name: string,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const itemExists = await context.semantic.tag.existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Tag exists');
  }
}
