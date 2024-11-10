import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {DeleteFileBackendMountEndpoint} from './types.js';
import {beginDeleteFileBackendMount} from './utils.js';
import {deleteFileBackendMountJoiSchema} from './validation.js';

const deleteFileBackendMount: DeleteFileBackendMountEndpoint =
  async reqData => {
    const mountModel = kSemanticModels.fileBackendMount();
    const data = validate(reqData.data, deleteFileBackendMountJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    await checkAuthorizationWithAgent({
      agent,
      workspaceId,
      target: {
        action: kFimidaraPermissionActions.deleteFileBackendMount,
        targetId: data.mountId,
      },
    });

    const mount = await mountModel.getOneById(data.mountId);
    appAssert(mount, kReuseableErrors.mount.notFound());

    if (mount.backend === kFileBackendType.fimidara) {
      throw kReuseableErrors.mount.cannotDeleteFimidaraMount();
    }

    const [job] = await beginDeleteFileBackendMount({
      agent,
      workspaceId,
      resources: [mount],
    });
    appAssert(job);
    return {jobId: job.resourceId};
  };

export default deleteFileBackendMount;
