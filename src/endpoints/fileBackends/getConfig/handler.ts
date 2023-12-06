import {container} from 'tsyringe';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {NotFoundError} from '../../errors';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigExtractor} from '../utils';
import {GetFileBackendConfigEndpoint} from './types';
import {getFileBackendConfigJoiSchema} from './validation';

const getFileBackendConfig: GetFileBackendConfigEndpoint = async (context, instData) => {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );

  const data = validate(instData.data, getFileBackendConfigJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'readFileBackendConfig', targetId: workspace.resourceId},
  });

  const config = await configModel.getOneById(data.configId);
  appAssert(config, new NotFoundError());

  return {config: fileBackendConfigExtractor(config)};
};

export default getFileBackendConfig;
