import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {DeleteFileBackendConfigEndpoint} from './types';
import {beginDeleteFileBackendConfig} from './utils';
import {deleteFileBackendConfigJoiSchema} from './validation';

const deleteFileBackendConfig: DeleteFileBackendConfigEndpoint = async instData => {
  const configModel = kSemanticModels.fileBackendConfig();
  const data = validate(instData.data, deleteFileBackendConfigJoiSchema);
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
      action: kFimidaraPermissionActionsMap.deleteFileBackendConfig,
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

  const [job] = await beginDeleteFileBackendConfig({
    agent,
    workspaceId: workspace.resourceId,
    resources: [config],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteFileBackendConfig;
