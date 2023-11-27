import {container} from 'tsyringe';
import {AppResourceTypeMap} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kInjectionKeys} from '../../contexts/injectionKeys';
import {SemanticDataAccessFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {NotFoundError} from '../../errors';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {DeleteFileBackendConfigEndpoint} from './types';
import {deleteFileBackendConfigJoiSchema} from './validation';

const deleteFileBackendConfig: DeleteFileBackendConfigEndpoint = async (
  context,
  instData
) => {
  const configModel = container.resolve<SemanticDataAccessFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );

  const data = validate(instData.data, deleteFileBackendConfigJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'deleteFileBackendConfig', targetId: workspace.resourceId},
  });

  const config = await configModel.getOneById(data.configId);
  appAssert(config, new NotFoundError());

  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceTypeMap.FileBackendConfig,
    args: {workspaceId: config.workspaceId, resourceId: config.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteFileBackendConfig;
