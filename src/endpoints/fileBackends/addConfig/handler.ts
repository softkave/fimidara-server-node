import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigExtractor} from '../utils';
import {AddFileBackendConfigEndpoint} from './types';
import {INTERNAL_addConfig} from './utils';
import {addConfigJoiSchema} from './validation';

const addFileBackendConfig: AddFileBackendConfigEndpoint = async instData => {
  const data = validate(instData.data, addConfigJoiSchema);
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
      action: kFimidaraPermissionActionsMap.addFileBackendConfig,
      targetId: workspace.resourceId,
    },
  });

  const backend = await kSemanticModels.utils().withTxn(async opts => {
    return await INTERNAL_addConfig(agent, workspace, data.config, opts);
  }, /** reuseTxn */ false);

  return {config: fileBackendConfigExtractor(backend)};
};

export default addFileBackendConfig;
