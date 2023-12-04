import {faker} from '@faker-js/faker';
import {container} from 'tsyringe';
import {
  FileBackendMount,
  FileBackendProductTypeMap,
  FileBackendTypeMap,
} from '../../../definitions/fileBackend';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {kInjectionKeys} from '../../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderUtils,
} from '../../contexts/semantic/types';

export function generateFileBackendMountForTest(seed: Partial<FileBackendMount> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const token: FileBackendMount = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceTypeMap.FileBackendMount),
    workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
    configId: getNewIdForResource(AppResourceTypeMap.FileBackendConfig),
    folderpath: faker.system.directoryPath().split('/'),
    index: faker.number.int(),
    mountedFrom: faker.system.directoryPath().split('/'),
    backend: faker.helpers.arrayElement(Object.values(FileBackendProductTypeMap)),
    backend: faker.helpers.arrayElement(Object.values(FileBackendTypeMap)),
    ...seed,
  };
  return token;
}

export function generateFileBackendMountListForTest(
  count = 20,
  seed: Partial<FileBackendMount> = {}
) {
  const items: FileBackendMount[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateFileBackendMountForTest(seed));
  }
  return items;
}

export async function generateAndInsertFileBackendMountListForTest(
  count = 20,
  seed: Partial<FileBackendMount> = {}
) {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );

  const items = generateFileBackendMountListForTest(count, seed);
  await semanticUtils.withTxn(async opts => mountModel.insertItem(items, opts));
  return items;
}
