import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {ResourceExistsError} from '../errors.js';

export async function checkTagNameExists(params: {
  workspaceId: string;
  name: string;
  resourceId?: string;
  opts?: SemanticProviderOpParams;
}) {
  const {workspaceId, name, resourceId, opts} = params;
  const item = await kIjxSemantic
    .tag()
    .getByName(workspaceId, name, {...opts, projection: {resourceId: true}});

  if (item && item.resourceId !== resourceId) {
    throw new ResourceExistsError('Tag exists');
  }
}
