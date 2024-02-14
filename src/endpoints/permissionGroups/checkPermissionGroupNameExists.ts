import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderTxnOptions} from '../contexts/semantic/types';
import {ResourceExistsError} from '../errors';

export async function checkPermissionGroupNameExists(
  workspaceId: string,
  name: string,
  opts?: SemanticProviderTxnOptions
) {
  const itemExists = await kSemanticModels
    .permissionGroup()
    .existsByName(workspaceId, name, opts);
  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }
}
