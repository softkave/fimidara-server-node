import {container} from 'tsyringe';
import {AppResourceTypeMap} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kInjectionKeys} from '../../contexts/injectionKeys';
import {SemanticDataAccessFileBackendMountProvider} from '../../contexts/semantic/types';
import {NotFoundError} from '../../errors';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {DeleteFileBackendMountEndpoint} from './types';
import {deleteFileBackendMountJoiSchema} from './validation';

const deleteFileBackendMount: DeleteFileBackendMountEndpoint = async (
  context,
  instData
) => {
  const mountModel = container.resolve<SemanticDataAccessFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const data = validate(instData.data, deleteFileBackendMountJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'deleteFileBackendMount', targetId: workspace.resourceId},
  });

  const mount = await mountModel.getOneById(data.mountId);
  appAssert(mount, new NotFoundError());

  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceTypeMap.FileBackendMount,
    args: {workspaceId: mount.workspaceId, resourceId: mount.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteFileBackendMount;
