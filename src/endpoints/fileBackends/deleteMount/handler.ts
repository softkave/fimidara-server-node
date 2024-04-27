import {kFileBackendType} from '../../../definitions/fileBackend';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {DeleteFileBackendMountEndpoint} from './types';
import {beginDeleteFileBackendMount} from './utils';
import {deleteFileBackendMountJoiSchema} from './validation';

const deleteFileBackendMount: DeleteFileBackendMountEndpoint = async instData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(instData.data, deleteFileBackendMountJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {
      action: kFimidaraPermissionActionsMap.deleteFileBackendMount,
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
