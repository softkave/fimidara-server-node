import {container} from 'tsyringe';
import {FileBackendConfig} from '../../../definitions/fileBackend';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {newWorkspaceResource} from '../../../utils/resource';
import {EncryptionProvider} from '../../contexts/encryption/types';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {ResourceExistsError} from '../../errors';
import {AddFileBackendConfigEndpointParams} from './types';

export const INTERNAL_addConfig = async (
  agent: Agent,
  workspace: Workspace,
  data: AddFileBackendConfigEndpointParams,
  opts: SemanticProviderMutationRunOptions
) => {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );
  const encryptionProvider = container.resolve<EncryptionProvider>(
    kInjectionKeys.encryption
  );

  const configExists = await configModel.getByName(workspace.resourceId, data.name, opts);

  if (configExists) {
    throw new ResourceExistsError(`File backend config with name ${data.name} exists.`);
  }

  const config = newWorkspaceResource<FileBackendConfig>(
    agent,
    AppResourceTypeMap.FileBackendConfig,
    workspace.resourceId,
    {
      backend: data.type,
      credentials: '',
      cipher: '',
      name: data.name,
      description: data.description,
    }
  );

  const unencryptedCredentials = JSON.stringify(data.credentials);
  const {cipher, encryptedText} = await encryptionProvider.encryptText(
    unencryptedCredentials
  );
  config.credentials = encryptedText;
  config.cipher = cipher;

  await configModel.insertItem(config, opts);

  appAssert(config);
  return config;
};
