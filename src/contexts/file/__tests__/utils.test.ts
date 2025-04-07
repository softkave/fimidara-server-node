import {randomUUID} from 'crypto';
import {tmpdir} from 'os';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {generateTestFilepath} from '../../../endpoints/testHelpers/generate/file.js';
import {
  generateAWSS3Credentials,
  generateFileBackendConfigForTest,
  generateFileBackendMountForTest,
} from '../../../endpoints/testHelpers/generate/fileBackend.js';
import {generateTestFolderpath} from '../../../endpoints/testHelpers/generate/folder.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {pathJoin} from '../../../utils/fns.js';
import {FimidaraFilePersistenceProvider} from '../FimidaraFilePersistenceProvider.js';
import {LocalFsFilePersistenceProvider} from '../LocalFsFilePersistenceProvider.js';
import {MemoryFilePersistenceProvider} from '../MemoryFilePersistenceProvider.js';
import {S3FilePersistenceProvider} from '../S3FilePersistenceProvider.js';
import {
  defaultFileProviderResolver,
  defaultToFimidaraPath,
  defaultToNativePath,
  isFilePersistenceProvider,
} from '../utils.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('utils', () => {
  test('isFilePersistenceProvider', () => {
    expect(
      isFilePersistenceProvider(new FimidaraFilePersistenceProvider())
    ).toBeTruthy();
    expect(
      isFilePersistenceProvider(
        new LocalFsFilePersistenceProvider({
          // TODO: we should clean this up
          dir: tmpdir() + '/' + randomUUID(),
          partsDir: tmpdir() + '/' + randomUUID(),
        })
      )
    ).toBeTruthy();
    expect(
      isFilePersistenceProvider(new MemoryFilePersistenceProvider())
    ).toBeTruthy();
    expect(
      isFilePersistenceProvider(
        new S3FilePersistenceProvider(generateAWSS3Credentials())
      )
    ).toBeTruthy();
  });

  test('defaultFileProviderResolver', () => {
    const s3Creds = generateAWSS3Credentials();
    const s3Config = generateFileBackendConfigForTest({
      backend: kFileBackendType.s3,
    });
    const fimidaraMount = generateFileBackendMountForTest({
      backend: kFileBackendType.fimidara,
    });
    const s3Mount = generateFileBackendMountForTest({
      backend: kFileBackendType.s3,
      configId: s3Config.resourceId,
    });

    const fimidaraBackend = defaultFileProviderResolver(fimidaraMount);
    const s3Backend = defaultFileProviderResolver(s3Mount, s3Creds, s3Config);

    expect(fimidaraBackend).toBeInstanceOf(FimidaraFilePersistenceProvider);
    expect(s3Backend).toBeInstanceOf(S3FilePersistenceProvider);
  });

  test('defaultToNativePath', () => {
    const mount = generateFileBackendMountForTest();
    const preMountPrefix = generateTestFolderpath({length: 2});
    const postMountPrefix = generateTestFolderpath({length: 2});
    const filepathMinusMountPath = generateTestFilepath({length: 2});
    const filepath = pathJoin(mount.namepath.concat(filepathMinusMountPath));

    const nativePath = defaultToNativePath(
      mount,
      filepath,
      preMountPrefix,
      postMountPrefix
    );

    const extpectedNativePath = pathJoin(
      preMountPrefix,
      mount.mountedFrom,
      postMountPrefix,
      filepathMinusMountPath
    );
    expect(nativePath).toBe(extpectedNativePath);
  });

  test('defaultToFimidaraPath', () => {
    const mount = generateFileBackendMountForTest();
    const preMountPrefix = generateTestFolderpath({length: 2});
    const postMountPrefix = generateTestFolderpath({length: 2});
    const filepathMinusMountPath = generateTestFilepath({length: 2});
    const filepath = pathJoin(mount.namepath.concat(filepathMinusMountPath));
    const nativePath = pathJoin(
      preMountPrefix,
      mount.mountedFrom,
      postMountPrefix,
      filepathMinusMountPath
    );

    const fimidaraPath = defaultToFimidaraPath(
      mount,
      nativePath,
      preMountPrefix,
      postMountPrefix
    );

    expect(fimidaraPath).toBe(filepath);
  });
});
