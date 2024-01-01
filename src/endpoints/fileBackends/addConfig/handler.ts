import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigExtractor} from '../utils';
import {AddFileBackendConfigEndpoint} from './types';
import {INTERNAL_addConfig} from './utils';
import {addConfigJoiSchema} from './validation';

const addFileBackendConfig: AddFileBackendConfigEndpoint = async instData => {
  const data = validate(instData.data, addConfigJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'adFileBackendConfig', targetId: workspace.resourceId},
  });

  const backend = await kSemanticModels.utils().withTxn(async opts => {
    return await INTERNAL_addConfig(agent, workspace, data.config, opts);
  });

  return {config: fileBackendConfigExtractor(backend)};
};

export default addFileBackendConfig;
