import {kPermissionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigExtractor} from '../utils';
import {GetFileBackendConfigEndpoint} from './types';
import {getFileBackendConfigJoiSchema} from './validation';

const getFileBackendConfig: GetFileBackendConfigEndpoint = async instData => {
  const configModel = kSemanticModels.fileBackendConfig();

  const data = validate(instData.data, getFileBackendConfigJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {
      action: kPermissionsMap.readFileBackendConfig,
      targetId: workspace.resourceId,
    },
  });

  const config = await configModel.getOneById(data.configId);
  appAssert(config, kReuseableErrors.config.notFound());

  return {config: fileBackendConfigExtractor(config)};
};

export default getFileBackendConfig;
