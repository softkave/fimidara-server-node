import {keyBy} from 'lodash-es';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderQueryListParams} from '../../contexts/semantic/types.js';
import {FileBackendConfig} from '../../definitions/fileBackend.js';
import {NotFoundError} from '../errors.js';

export async function getBackendConfigsWithIdList(
  configIdList: Array<string>,
  throwErrorIfConfigNotFound = true,
  opts?: SemanticProviderQueryListParams<FileBackendConfig>
) {
  if (configIdList.length === 0) {
    return [];
  }

  const configs = await kIjxSemantic
    .fileBackendConfig()
    .getManyByIdList(configIdList, opts);

  if (throwErrorIfConfigNotFound) {
    const configsMap = keyBy(configs, config => config.resourceId);
    configIdList.forEach(id => {
      if (!configsMap[id]) {
        throw new NotFoundError(`Backend config with ID ${id} does not exist`);
      }
    });
  }

  return configs;
}
