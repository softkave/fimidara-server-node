import {faker} from '@faker-js/faker';
import {S3FilePersistenceProviderInitParams} from '../../../contexts/file/S3FilePersistenceProvider.js';
import {
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../../../contexts/file/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  FileBackendConfig,
  FileBackendMount,
  kFileBackendType,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {mergeData, pathSplit} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kValidationConstants} from '../../../utils/validationUtils.js';
import {NewFileBackendConfigInput} from '../../fileBackends/addConfig/types.js';
import {NewFileBackendMountInput} from '../../fileBackends/addMount/types.js';
import {kFileBackendConstants} from '../../fileBackends/constants.js';
import {stringifyFilenamepath} from '../../files/utils.js';
import {generateTestFilepath, generateTestFilepathString} from './file.js';
import {generateTestFolderpathString} from './folder.js';

export function generateAWSS3Credentials(
  seed: Partial<S3FilePersistenceProviderInitParams> = {}
): S3FilePersistenceProviderInitParams {
  return {
    accessKeyId: faker.string.alphanumeric(
      kValidationConstants.awsAccessKeyIdLength
    ),
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
    configId: getNewIdForResource(kFimidaraResourceType.FileBackendConfig),
    ...seed,
  };
}

export function generateFileBackendMountForTest(
  seed: Partial<FileBackendMount> = {}
) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
  };
  const mount: FileBackendMount = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kFimidaraResourceType.FileBackendMount),
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    configId: getNewIdForResource(kFimidaraResourceType.FileBackendConfig),
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

export function generateFileBackendConfigForTest(
  seed: Partial<FileBackendConfig> = {}
) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
  };
  const config: FileBackendConfig = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kFimidaraResourceType.FileBackendConfig),
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
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
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
  };
  const backendNamepath = generateTestFilepath();
  const backendExt = faker.system.fileExt();
  const mountId = getNewIdForResource(kFimidaraResourceType.FileBackendMount);
  const config: ResolvedMountEntry = {
    createdAt,
    createdBy,
    backendNamepath,
    backendExt,
    mountId,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kFimidaraResourceType.ResolvedMountEntry),
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    fimidaraNamepath: generateTestFilepath(),
    fimidaraExt: faker.system.fileExt(),
    forId: getNewIdForResource(kFimidaraResourceType.File),
    forType: kFimidaraResourceType.File,
    persisted: {
      mountId,
      filepath: stringifyFilenamepath({
        namepath: backendNamepath,
        ext: backendExt,
      }),
      raw: undefined,
    },
    isDeleted: false,
  };
  return mergeData(config, seed, {arrayUpdateStrategy: 'replace'});
}

export function generatePersistedFolderDescriptionForTest<T = undefined>(
  seed: Partial<PersistedFolderDescription<T>> = {}
): PersistedFolderDescription<T> {
  return {
    folderpath: generateTestFolderpathString(),
    mountId: getNewIdForResource(kFimidaraResourceType.FileBackendMount),
    raw: undefined as T,
    ...seed,
  };
}

export function generatePersistedFileDescriptionForTest<T = undefined>(
  seed: Partial<PersistedFileDescription<T>> = {}
): PersistedFileDescription<T> {
  return {
    filepath: generateTestFilepathString(),
    mountId: getNewIdForResource(kFimidaraResourceType.FileBackendMount),
    lastUpdatedAt: getTimestamp(),
    mimetype: faker.system.mimeType(),
    encoding: 'utf-8',
    size: faker.number.int(),
    raw: undefined as T,
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
  const mountModel = kIjxSemantic.fileBackendMount();
  const semanticUtils = kIjxSemantic.utils();

  const items = generateFileBackendMountListForTest(count, seed);
  await semanticUtils.withTxn(async opts => mountModel.insertItem(items, opts));
  return items;
}

export async function generateAndInsertFileBackendConfigListForTest(
  count = 20,
  seed: Partial<FileBackendConfig> = {}
) {
  const configModel = kIjxSemantic.fileBackendConfig();
  const semanticUtils = kIjxSemantic.utils();

  const items = generateFileBackendConfigListForTest(count, seed);
  await semanticUtils.withTxn(async opts =>
    configModel.insertItem(items, opts)
  );
  return items;
}

export async function generateAndInsertResolvedMountEntryListForTest(
  count = 20,
  seed: Partial<ResolvedMountEntry> = {}
) {
  const model = kIjxSemantic.resolvedMountEntry();
  const items = generateResolvedMountEntryListForTest(count, seed);

  await kIjxSemantic
    .utils()
    .withTxn(async opts => model.insertItem(items, opts));

  return items;
}
