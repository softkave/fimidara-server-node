import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';

export async function getSysOpMount(params: {
  mountId: string;
  workspaceId: string;
}) {
  const mount = await kSemanticModels
    .fileBackendMount()
    .getOneById(params.mountId);

  appAssert(mount, kReuseableErrors.mount.notFound(params.mountId));
  appAssert(
    mount.workspaceId === params.workspaceId,
    'Mount workspace id does not match request workspace id'
  );
  appAssert(
    mount.backend === kFileBackendType.fimidara,
    'Only supports sys read for fimidara backend'
  );

  return mount;
}
