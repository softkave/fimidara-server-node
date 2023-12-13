import {faker} from '@faker-js/faker';
import {container} from 'tsyringe';
import {
  FileBackendConfig,
  FileBackendMount,
  FileBackendTypeMap,
} from '../../../definitions/fileBackend';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {validationConstants} from '../../../utils/validationUtils';
import {S3FilePersistenceProviderInitParams} from '../../contexts/file/S3FilePersistenceProvider';
import {kInjectionKeys} from '../../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderUtils,
} from '../../contexts/semantic/types';
import {NewFileBackendConfigInput} from '../../fileBackends/addConfig/types';
import {NewFileBackendMountInput} from '../../fileBackends/addMount/types';
import {kFileBackendConstants} from '../../fileBackends/constants';
import {generateTestFolderpath} from './folder';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';

export function generateAWSS3Credentials(
  seed: Partial<S3FilePersistenceProviderInitParams> = {}
): S3FilePersistenceProviderInitParams {
  return {
    accessKeyId: faker.string.alphanumeric(validationConstants.awsAccessKeyIdLength),
    secretAccessKey: faker.string.alphanumeric(
      validationConstants.awsSecretAccessKeyLength
    ),
    region: faker.helpers.arrayElement(kFileBackendConstants.awsRegions),
    ...seed,
  };
}

export function generateFileBackendTypeForInput() {
  return faker.helpers.arrayElement(
    Object.values(FileBackendTypeMap).filter(type => type !== 'fimidara')
  );
}

export const fileBackendToCredentialsGenerator = {
  [FileBackendTypeMap.S3]: generateAWSS3Credentials,
  [FileBackendTypeMap.Fimidara]: () => ({}),
} as const;

export function generateFileBackendConfigInput(
  seed: Partial<NewFileBackendConfigInput>
): NewFileBackendConfigInput {
  const backend = seed.backend || generateFileBackendTypeForInput();
  return {
    backend,
    name: faker.lorem.words(7),
    description: faker.lorem.words(10),
    credentials: fileBackendToCredentialsGenerator[backend](),
    ...seed,
  };
}

export function generateFileBackendMountInput(
  seed: Partial<NewFileBackendMountInput>
): NewFileBackendMountInput {
  return {
    name: faker.lorem.words(7),
    description: faker.lorem.words(10),
    folderpath: generateTestFolderpath(),
    index: faker.number.int(),
    mountedFrom: generateTestFolderpath(),
    backend: generateFileBackendTypeForInput(),
    configId: getNewIdForResource(AppResourceTypeMap.FileBackendConfig),
    ...seed,
  };
}

export function generateFileBackendMountForTest(seed: Partial<FileBackendMount> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const mount: FileBackendMount = {
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
    backend: faker.helpers.arrayElement(Object.values(FileBackendTypeMap)),
    name: faker.lorem.words(),
    ...seed,
  };
  return mount;
}

export function generateFileBackendConfigForTest(seed: Partial<FileBackendConfig> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const config: FileBackendConfig = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceTypeMap.FileBackendConfig),
    workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
    name: faker.lorem.words(),
    backend: faker.helpers.arrayElement(Object.values(FileBackendTypeMap)),
    secretId: faker.string.alphanumeric(),
    ...seed,
  };
  return config;
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

export function generateFileBackendConfigListForTest(
  count = 20,
  seed: Partial<FileBackendConfig> = {}
) {
  const items: FileBackendConfig[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateFileBackendConfigForTest(seed));
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

export async function generateAndInsertFileBackendConfigListForTest(
  count = 20,
  seed: Partial<FileBackendConfig> = {}
) {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );

  const items = generateFileBackendConfigListForTest(count, seed);
  await semanticUtils.withTxn(async opts => configModel.insertItem(items, opts));
  return items;
}
