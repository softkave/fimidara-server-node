import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigExtractor} from '../utils';
import {ConfigFileBackendEndpoint} from './types';
import {INTERNAL_configFileBackend} from './utils';
import {configFileBackendJoiSchema} from './validation';

const configFileBackendEndpoint: ConfigFileBackendEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, configFileBackendJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'configFileBackend', targetId: workspace.resourceId},
  });

  const backend = await context.semantic.utils.withTxn(context, async opts => {
    return await INTERNAL_configFileBackend(agent, workspace, data, opts);
  });

  return {config: fileBackendConfigExtractor(backend)};
};

export default configFileBackendEndpoint;
