import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigExtractor} from '../utils';
import {AddConfigEndpoint} from './types';
import {INTERNAL_addConfig} from './utils';
import {addConfigJoiSchema} from './validation';

const addConfigEndpoint: AddConfigEndpoint = async (context, instData) => {
  const data = validate(instData.data, addConfigJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'addConfig', targetId: workspace.resourceId},
  });

  const backend = await kSemanticModels.utils().withTxn(async opts => {
    return await INTERNAL_addConfig(agent, workspace, data, opts);
  });

  return {config: fileBackendConfigExtractor(backend)};
};

export default addConfigEndpoint;
