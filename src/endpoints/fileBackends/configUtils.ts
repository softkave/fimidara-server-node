import {keyBy} from 'lodash';
import {container} from 'tsyringe';
import {FileBackendConfig, FileBackendMount} from '../../definitions/fileBackend';
import {ServerError} from '../../utils/errors';
import {kAsyncLocalStorageUtils} from '../contexts/asyncLocalStorage';
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

type FilePersistenceProvidersByMount = Record<
  /** mountId */ string,
  FilePersistenceProvider
>;

export async function initBackendProvidersForMounts(
  mounts: FileBackendMount[],
  configs: FileBackendConfig[]
) {
  const providersMap: FilePersistenceProvidersByMount = {};
  const configsMap: Record<string, {config: FileBackendConfig; providerParams: unknown}> =
    {};

  await Promise.all(
    configs.map(async config => {
      const {text: credentials} = await kUtilsInjectables.secretsManager().getSecret({
        id: config.secretId,
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

    const provider = kUtilsInjectables.fileProviderResolver()(
      mount.backend,
      providerParams
    );
    providersMap[mount.resourceId] = provider;
  });

  kAsyncLocalStorageUtils.addDisposable(Object.values(providersMap));
  return providersMap;
}
