import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {FileBackendConfig} from '../../../definitions/fileBackend.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {configNameExists} from '../utils.js';
import {NewFileBackendConfigInput} from './types.js';

export const INTERNAL_addConfig = async (
  agent: Agent,
  workspace: Workspace,
  data: NewFileBackendConfigInput,
  opts: SemanticProviderMutationParams
) => {
  const configModel = kIjxSemantic.fileBackendConfig();
  const secretsManager = kIjxUtils.secretsManager();

  if (data.backend === 'fimidara') {
    throw kReuseableErrors.config.fimidaraDoesNotSupportConfig();
  }

  const configExists = await configNameExists({
    workspaceId: workspace.resourceId,
    name: data.name,
  });

  if (configExists) {
    throw kReuseableErrors.config.configExists();
  }

  let config = newWorkspaceResource<FileBackendConfig>(
    agent,
    kFimidaraResourceType.FileBackendConfig,
    workspace.resourceId,
    {
      backend: data.backend,
      name: data.name,
      description: data.description,
      secretId: '',
    }
  );

  await configModel.insertItem(config, opts);
  const unencryptedCredentials = JSON.stringify(data.credentials);
  const {secretId: secretId} = await secretsManager.addSecret({
    name: config.resourceId,
    text: unencryptedCredentials,
  });

  const updatedConfig = await configModel.getAndUpdateOneById(
    config.resourceId,
    {secretId},
    opts
  );

  appAssert(updatedConfig);
  config = updatedConfig;

  return config;
};
