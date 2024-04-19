import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderOpParams} from '../contexts/semantic/types';
import {ResourceExistsError} from '../errors';

export async function checkTagNameExists(
  workspaceId: string,
  name: string,
  opts?: SemanticProviderOpParams
) {
  const itemExists = await kSemanticModels.tag().existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Tag exists');
  }
}
