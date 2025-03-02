import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {fileBackendConfigExtractor} from '../utils.js';
import {AddFileBackendConfigEndpoint} from './types.js';
import {INTERNAL_addConfig} from './utils.js';
import {addConfigJoiSchema} from './validation.js';

const addFileBackendConfig: AddFileBackendConfigEndpoint = async reqData => {
  const data = validate(reqData.data, addConfigJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {
      action: kFimidaraPermissionActions.addFileBackendConfig,
      targetId: workspace.resourceId,
    },
  });

  const backend = await kIjxSemantic.utils().withTxn(async opts => {
    return await INTERNAL_addConfig(agent, workspace, data, opts);
  });

  return {config: fileBackendConfigExtractor(backend)};
};

export default addFileBackendConfig;
