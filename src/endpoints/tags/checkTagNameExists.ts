import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {ResourceExistsError} from '../errors.js';

export async function checkTagNameExists(
  workspaceId: string,
  name: string,
  opts?: SemanticProviderOpParams
) {
  const itemExists = await kSemanticModels
    .tag()
    .existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Tag exists');
  }
}
