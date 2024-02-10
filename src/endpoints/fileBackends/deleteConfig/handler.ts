import {kPermissionsMap} from '../../../definitions/permissionItem';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {DeleteFileBackendConfigEndpoint} from './types';
import {deleteFileBackendConfigJoiSchema} from './validation';

const deleteFileBackendConfig: DeleteFileBackendConfigEndpoint = async instData => {
  const configModel = kSemanticModels.fileBackendConfig();

  const data = validate(instData.data, deleteFileBackendConfigJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {
      action: kPermissionsMap.deleteFileBackendConfig,
      targetId: workspace.resourceId,
    },
  });

  const config = await configModel.getOneById(data.configId);
  appAssert(config, kReuseableErrors.config.notFound());

  const configMountsCount = await kSemanticModels
    .fileBackendMount()
    .countByQuery({configId: config.resourceId});

  if (configMountsCount > 0) {
    throw kReuseableErrors.config.configInUse(configMountsCount);
  }

  const job = await enqueueDeleteResourceJob({
    type: kAppResourceType.FileBackendConfig,
    workspaceId: config.workspaceId,
    resourceId: config.resourceId,
  });

  return {jobId: job.resourceId};
};

export default deleteFileBackendConfig;
