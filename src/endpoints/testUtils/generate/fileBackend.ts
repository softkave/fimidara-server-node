import {faker} from '@faker-js/faker';
import {
  FileBackendConfig,
  FileBackendMount,
  kFileBackendType,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend';
import {Agent, kAppResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {mergeData, pathSplit} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {kValidationConstants} from '../../../utils/validationUtils';
import {S3FilePersistenceProviderInitParams} from '../../contexts/file/S3FilePersistenceProvider';
import {
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../../contexts/file/types';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {NewFileBackendConfigInput} from '../../fileBackends/addConfig/types';
import {NewFileBackendMountInput} from '../../fileBackends/addMount/types';
import {kFileBackendConstants} from '../../fileBackends/constants';
import {generateTestFilepath, generateTestFilepathString} from './file';
import {generateTestFolderpathString} from './folder';

export function generateAWSS3Credentials(
  seed: Partial<S3FilePersistenceProviderInitParams> = {}
): S3FilePersistenceProviderInitParams {
  return {
    accessKeyId: faker.string.alphanumeric(kValidationConstants.awsAccessKeyIdLength),
    secretAccessKey: faker.string.alphanumeric(
      kValidationConstants.awsSecretAccessKeyLength
    ),
    region: faker.helpers.arrayElement(kFileBackendConstants.awsRegions),
    ...seed,
  };
}

export function generateFileBackendType() {
  return faker.helpers.arrayElement(Object.values(kFileBackendType));
}

export function generateFileBackendTypeForInput() {
  return faker.helpers.arrayElement(
    Object.values(kFileBackendType).filter(type => type !== 'fimidara')
  );
}

export const fileBackendToCredentialsGenerator = {
  [kFileBackendType.s3]: generateAWSS3Credentials,
  [kFileBackendType.fimidara]: () => ({}),
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
    folderpath: generateTestFolderpathString(),
    index: faker.number.int(),
    mountedFrom: generateTestFolderpathString(),
    backend: generateFileBackendTypeForInput(),
    configId: getNewIdForResource(kAppResourceType.FileBackendConfig),
    ...seed,
  };
}

export function generateFileBackendMountForTest(seed: Partial<FileBackendMount> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kAppResourceType.User),
    agentType: kAppResourceType.User,
    agentTokenId: getNewIdForResource(kAppResourceType.AgentToken),
  };
  const mount: FileBackendMount = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kAppResourceType.FileBackendMount),
    workspaceId: getNewIdForResource(kAppResourceType.Workspace),
    configId: getNewIdForResource(kAppResourceType.FileBackendConfig),
    namepath: pathSplit(faker.system.directoryPath()),
    index: faker.number.int(),
    mountedFrom: pathSplit(faker.system.directoryPath()),
    backend: faker.helpers.arrayElement(Object.values(kFileBackendType)),
    name: faker.lorem.words(),
    isDeleted: false,
    ...seed,
  };
  return mount;
}

export function generateFileBackendConfigForTest(seed: Partial<FileBackendConfig> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kAppResourceType.User),
    agentType: kAppResourceType.User,
    agentTokenId: getNewIdForResource(kAppResourceType.AgentToken),
  };
  const config: FileBackendConfig = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kAppResourceType.FileBackendConfig),
    workspaceId: getNewIdForResource(kAppResourceType.Workspace),
    name: faker.lorem.words(),
    backend: faker.helpers.arrayElement(Object.values(kFileBackendType)),
    secretId: faker.string.alphanumeric(),
    isDeleted: false,
    ...seed,
  };
  return config;
}

export function generateResolvedMountEntryForTest(
  seed: Partial<ResolvedMountEntry> = {}
) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kAppResourceType.User),
    agentType: kAppResourceType.User,
    agentTokenId: getNewIdForResource(kAppResourceType.AgentToken),
  };
  const config: ResolvedMountEntry = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kAppResourceType.ResolvedMountEntry),
    workspaceId: getNewIdForResource(kAppResourceType.Workspace),
    mountId: getNewIdForResource(kAppResourceType.FileBackendMount),
    resolvedAt: getTimestamp(),
    namepath: generateTestFilepath(),
    extension: faker.system.fileExt(),
    resolvedFor: getNewIdForResource(kAppResourceType.File),
    resolvedForType: kAppResourceType.File,
    other: null,
    isDeleted: false,
  };
  return mergeData(config, seed, {arrayUpdateStrategy: 'replace'});
}

export function generatePersistedFolderDescriptionForTest(
  seed: Partial<PersistedFolderDescription> = {}
): PersistedFolderDescription {
  return {
    folderpath: generateTestFolderpathString(),
    mountId: getNewIdForResource(kAppResourceType.FileBackendMount),
    ...seed,
  };
}

export function generatePersistedFileDescriptionForTest(
  seed: Partial<PersistedFileDescription> = {}
): PersistedFileDescription {
  return {
    filepath: generateTestFilepathString(),
    mountId: getNewIdForResource(kAppResourceType.FileBackendMount),
    lastUpdatedAt: getTimestamp(),
    mimetype: faker.system.mimeType(),
    encoding: 'utf-8',
    size: faker.number.int(),
    ...seed,
  };
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

export function generateResolvedMountEntryListForTest(
  count = 20,
  seed: Partial<ResolvedMountEntry> = {}
) {
  const items: ResolvedMountEntry[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generateResolvedMountEntryForTest(seed));
  }

  return items;
}

export function generatePersistedFolderDescriptionListForTest(
  count = 20,
  seed: Partial<PersistedFolderDescription> = {}
) {
  const items: PersistedFolderDescription[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generatePersistedFolderDescriptionForTest(seed));
  }

  return items;
}

export function generatePersistedFileDescriptionListForTest(
  count = 20,
  seed: Partial<PersistedFileDescription> = {}
) {
  const items: PersistedFileDescription[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generatePersistedFileDescriptionForTest(seed));
  }

  return items;
}

export async function generateAndInsertFileBackendMountListForTest(
  count = 20,
  seed: Partial<FileBackendMount> = {}
) {
  const mountModel = kSemanticModels.fileBackendMount();
  const semanticUtils = kSemanticModels.utils();

  const items = generateFileBackendMountListForTest(count, seed);
  await semanticUtils.withTxn(
    async opts => mountModel.insertItem(items, opts),
    /** reuseTxn */ true
  );
  return items;
}

export async function generateAndInsertFileBackendConfigListForTest(
  count = 20,
  seed: Partial<FileBackendConfig> = {}
) {
  const configModel = kSemanticModels.fileBackendConfig();
  const semanticUtils = kSemanticModels.utils();

  const items = generateFileBackendConfigListForTest(count, seed);
  await semanticUtils.withTxn(
    async opts => configModel.insertItem(items, opts),
    /** reuseTxn */ true
  );
  return items;
}

export async function generateAndInsertResolvedMountEntryListForTest(
  count = 20,
  seed: Partial<ResolvedMountEntry> = {}
) {
  const model = kSemanticModels.resolvedMountEntry();
  const items = generateResolvedMountEntryListForTest(count, seed);

  await kSemanticModels
    .utils()
    .withTxn(async opts => model.insertItem(items, opts), /** reuseTxn */ true);

  return items;
}
