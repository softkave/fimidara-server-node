import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigExtractor} from '../utils';
import {GetFileBackendConfigEndpoint} from './types';
import {getFileBackendConfigJoiSchema} from './validation';

const getFileBackendConfig: GetFileBackendConfigEndpoint = async instData => {
  const configModel = kSemanticModels.fileBackendConfig();
  const data = validate(instData.data, getFileBackendConfigJoiSchema);
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
      action: kFimidaraPermissionActionsMap.readFileBackendConfig,
      targetId: workspace.resourceId,
    },
  });

  const config = await configModel.getOneById(data.configId);
  appAssert(config, kReuseableErrors.config.notFound());

  return {config: fileBackendConfigExtractor(config)};
};

export default getFileBackendConfig;
