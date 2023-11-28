import {keyBy} from 'lodash';
import {container} from 'tsyringe';
import {FileBackendConfig, FileBackendMount} from '../../definitions/fileBackend';
import {extractResourceIdList} from '../../utils/fns';
import {EncryptionProvider} from '../contexts/encryption/types';
import {FilePersistenceProvider} from '../contexts/file/types';
import {resolveFilePersistenceProvider} from '../contexts/file/utils';
import {kInjectionKeys} from '../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../contexts/semantic/fileBackendConfig/types';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';

export async function resolveBackendConfigsFromMounts(
  mounts: Array<Pick<FileBackendMount, 'resourceId'>>,
  throwErrorIfConfigNotFound = true,
  opts?: SemanticProviderRunOptions
) {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );

  const idList = extractResourceIdList(mounts);
  const configs = await configModel.getManyByIdList(idList, opts);

  if (throwErrorIfConfigNotFound) {
    const configsMap = keyBy(configs, config => config.resourceId);
    idList.forEach(id => {
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
      providersMap[config.resourceId] = resolveFilePersistenceProvider(
        config.type,
        initParams
      );
    })
  );

  return providersMap;
}
