import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {fileBackendConfigExtractor} from '../utils.js';
import {GetFileBackendConfigEndpoint} from './types.js';
import {getFileBackendConfigJoiSchema} from './validation.js';

const getFileBackendConfig: GetFileBackendConfigEndpoint = async reqData => {
  const configModel = kSemanticModels.fileBackendConfig();
  const data = validate(reqData.data, getFileBackendConfigJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {data});

  await checkAuthorizationWithAgent({
    agent,
    workspaceId: workspace.resourceId,
    target: {
      action: kFimidaraPermissionActions.readFileBackendConfig,
      targetId: data.configId,
    },
  });

  const config = await configModel.getOneById(data.configId);
  appAssert(config, kReuseableErrors.config.notFound());

  return {config: fileBackendConfigExtractor(config)};
};

export default getFileBackendConfig;
