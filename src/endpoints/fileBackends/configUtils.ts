import {keyBy} from 'lodash';
import {container} from 'tsyringe';
import {FileBackendConfig, FileBackendMount} from '../../definitions/fileBackend';
import {ServerError} from '../../utils/errors';
import {EncryptionProvider} from '../contexts/encryption/types';
import {FilePersistenceProvider} from '../contexts/file/types';
import {kUtilsInjectables} from '../contexts/injectables';
import {kInjectionKeys} from '../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../contexts/semantic/fileBackendConfig/types';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';

export async function resolveBackendConfigsWithIdList(
  configIdList: Array<string>,
  throwErrorIfConfigNotFound = true,
  opts?: SemanticProviderRunOptions
) {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );

  const configs = await configModel.getManyByIdList(configIdList, opts);

  if (throwErrorIfConfigNotFound) {
    const configsMap = keyBy(configs, config => config.resourceId);
    configIdList.forEach(id => {
      if (!configsMap[id]) {
        throw new NotFoundError(`Backend config with ID ${id} does not exist.`);
      }
    });
  }

  return configs;
}

export async function initBackendProvidersFromConfigs(configs: FileBackendConfig[]) {
  const encryptionProvider = container.resolve<EncryptionProvider>(
    kInjectionKeys.encryption
  );

  const providersMap: Record<string, FilePersistenceProvider> = {};

  await Promise.all(
    configs.map(async config => {
      const credentials = await encryptionProvider.decryptText({
        encryptedText: config.credentials,
        cipher: config.cipher,
      });
      const initParams = JSON.parse(credentials);
      providersMap[config.resourceId] = kUtilsInjectables.fileProviderResolver()(
        config.backend,
        initParams
      );
    })
  );

  return providersMap;
}

export async function initBackendProvidersForMounts(
  mounts: FileBackendMount[],
  configs: FileBackendConfig[]
) {
  const encryptionProvider = container.resolve<EncryptionProvider>(
    kInjectionKeys.encryption
  );

  const providersMap: Record<string, FilePersistenceProvider> = {};
  const configsMap: Record<string, {config: FileBackendConfig; providerParams: unknown}> =
    {};

  await Promise.all(
    configs.map(async config => {
      const credentials = await encryptionProvider.decryptText({
        encryptedText: config.credentials,
        cipher: config.cipher,
      });
      const initParams = JSON.parse(credentials);
      configsMap[config.resourceId] = {config, providerParams: initParams};
    })
  );

  mounts.forEach(mount => {
    const {providerParams} = configsMap[mount.configId ?? ''] ?? {};

    if (mount.backend !== 'fimidara' && !providerParams) {
      console.log(`mount ${mount.resourceId} is not fimidara, and is without config`);
      throw new ServerError();
    }

    providersMap[mount.resourceId] = kUtilsInjectables.fileProviderResolver()(
      mount.backend,
      providerParams
    );
  });

  return providersMap;
}
