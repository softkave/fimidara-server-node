import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {DeleteFileBackendMountEndpoint} from './types.js';
import {beginDeleteFileBackendMount} from './utils.js';
import {deleteFileBackendMountJoiSchema} from './validation.js';

const deleteFileBackendMount: DeleteFileBackendMountEndpoint =
  async reqData => {
    const mountModel = kIjxSemantic.fileBackendMount();
    const data = validate(reqData.data, deleteFileBackendMountJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    await checkAuthorizationWithAgent({
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      target: {
        action: kFimidaraPermissionActions.deleteFileBackendMount,
        targetId: workspace.resourceId,
      },
    });

    const mount = await mountModel.getOneById(data.mountId);
    appAssert(mount, kReuseableErrors.mount.notFound());

    if (mount.backend === kFileBackendType.fimidara) {
      throw kReuseableErrors.mount.cannotDeleteFimidaraMount();
    }

    const [job] = await beginDeleteFileBackendMount({
      agent,
      workspaceId: workspace.resourceId,
      resources: [mount],
    });
    appAssert(job);
    return {jobId: job.resourceId};
  };

export default deleteFileBackendMount;
