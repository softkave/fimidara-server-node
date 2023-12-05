import {FileBackendConfig} from '../../../definitions/fileBackend';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {newWorkspaceResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {configNameExists} from '../utils';
import {NewFileBackendConfigInput} from './types';

export const INTERNAL_addConfig = async (
  agent: Agent,
  workspace: Workspace,
  data: NewFileBackendConfigInput,
  opts: SemanticProviderMutationRunOptions
) => {
  const configModel = kSemanticModels.fileBackendConfig();
  const secretsManager = kUtilsInjectables.secretsManager();

  const configExists = await configNameExists({
    workspaceId: workspace.resourceId,
    name: data.name,
  });

  if (configExists) {
    throw kReuseableErrors.config.configExists();
  }

  let config = newWorkspaceResource<FileBackendConfig>(
    agent,
    AppResourceTypeMap.FileBackendConfig,
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
  const {id: secretId} = await secretsManager.addSecret({
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