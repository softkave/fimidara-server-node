import {container} from 'tsyringe';
import {FileBackendConfig} from '../../../definitions/fileBackend';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {newWorkspaceResource} from '../../../utils/resource';
import {EncryptionProvider} from '../../contexts/encryption/types';
import {kInjectionKeys} from '../../contexts/injectionKeys';
import {SemanticDataAccessFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {ConfigFileBackendEndpointParams} from './types';

export const INTERNAL_configFileBackend = async (
  agent: Agent,
  workspace: Workspace,
  data: ConfigFileBackendEndpointParams,
  opts: SemanticDataAccessProviderMutationRunOptions
) => {
  let backendConfig: FileBackendConfig | null = null;

  const fileBackendConfigModel =
    container.resolve<SemanticDataAccessFileBackendConfigProvider>(
      kInjectionKeys.semantic.fileBackendConfig
    );
  const encryptionProvider = container.resolve<EncryptionProvider>(
    kInjectionKeys.encryption
  );

  backendConfig = await fileBackendConfigModel.getOneByQuery(
    {type: data.type, workspaceId: data.workspaceId},
    opts
  );

  if (!backendConfig) {
    backendConfig = newWorkspaceResource<FileBackendConfig>(
      agent,
      AppResourceTypeMap.FileBackendConfig,
      workspace.resourceId,
      {type: data.type, credentials: '', cipher: ''}
    );
  }

  const unencryptedCredentials = JSON.stringify(data.credentials);
  const {cipher, encryptedText} = await encryptionProvider.encryptText(
    unencryptedCredentials
  );
  backendConfig = await fileBackendConfigModel.getAndUpdateOneById(
    backendConfig.resourceId,
    {cipher, credentials: encryptedText},
    opts
  );

  appAssert(backendConfig);
  return backendConfig;
};
