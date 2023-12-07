import {container} from 'tsyringe';
import {AppResourceTypeMap} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../../contexts/injectables';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {NotFoundError} from '../../errors';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {DeleteFileBackendConfigEndpoint} from './types';
import {deleteFileBackendConfigJoiSchema} from './validation';
import {config} from 'process';

const deleteFileBackendConfig: DeleteFileBackendConfigEndpoint = async (
  context,
  instData
) => {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );

  const data = validate(instData.data, deleteFileBackendConfigJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'deleteFileBackendConfig', targetId: workspace.resourceId},
  });

  const config = await configModel.getOneById(data.configId);
  appAssert(config, new NotFoundError());

  const configMountsCount = await kSemanticModels
    .fileBackendMount()
    .countByQuery({configId: config.resourceId});

  if (configMountsCount > 0) {
    throw kReuseableErrors.config.configInUse(configMountsCount);
  }

  const job = await kSemanticModels.utils().withTxn(opts =>
    enqueueDeleteResourceJob(
      {
        type: AppResourceTypeMap.FileBackendConfig,
        args: {
          workspaceId: config.workspaceId,
          resourceId: config.resourceId,
          secretId: config.secretId,
        },
      },
      opts
    )
  );

  return {jobId: job.resourceId};
};

export default deleteFileBackendConfig;
