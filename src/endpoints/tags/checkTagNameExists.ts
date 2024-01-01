import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {ResourceExistsError} from '../errors';

export async function checkTagNameExists(
  workspaceId: string,
  name: string,
  opts?: SemanticProviderRunOptions
) {
  const itemExists = await kSemanticModels.tag().existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Tag exists');
  }
}
