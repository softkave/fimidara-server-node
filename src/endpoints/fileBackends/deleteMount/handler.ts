import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {NotFoundError} from '../../errors';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {DeleteFileBackendMountEndpoint} from './types';
import {deleteFileBackendMountJoiSchema} from './validation';

const deleteFileBackendMount: DeleteFileBackendMountEndpoint = async instData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(instData.data, deleteFileBackendMountJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'deleteFileBackendMount', targetId: workspace.resourceId},
  });

  const mount = await mountModel.getOneById(data.mountId);
  appAssert(mount, new NotFoundError());

  if (mount.backend === 'fimidara') {
    throw kReuseableErrors.mount.cannotDeleteFimidaraMount();
  }

  const job = await enqueueDeleteResourceJob({
    type: kAppResourceType.FileBackendMount,
    args: {workspaceId: mount.workspaceId, resourceId: mount.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteFileBackendMount;
