import {container} from 'tsyringe';
import {AppResourceTypeMap} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendMountProvider} from '../../contexts/semantic/types';
import {NotFoundError} from '../../errors';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {DeleteFileBackendMountEndpoint} from './types';
import {deleteFileBackendMountJoiSchema} from './validation';
import {enqueueDeleteResourceJob} from '../../jobs/utils';

const deleteFileBackendMount: DeleteFileBackendMountEndpoint = async (
  context,
  instData
) => {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const data = validate(instData.data, deleteFileBackendMountJoiSchema);
  const agent = await context.session.getAgent(context, instData);
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
    type: AppResourceTypeMap.FileBackendMount,
    args: {workspaceId: mount.workspaceId, resourceId: mount.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteFileBackendMount;
