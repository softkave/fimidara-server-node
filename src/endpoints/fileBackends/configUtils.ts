import {keyBy} from 'lodash';
import {container} from 'tsyringe';
import {kInjectionKeys} from '../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../contexts/semantic/fileBackendConfig/types';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';

export async function resolveBackendConfigsWithIdList(
  configIdList: Array<string>,
  throwErrorIfConfigNotFound = true,
  opts?: SemanticProviderRunOptions
) {
  if (configIdList.length === 0) {
    return [];
  }

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
