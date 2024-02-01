import {tmpdir} from 'os';
import {kFileBackendType} from '../../../../definitions/fileBackend';
import {pathJoin} from '../../../../utils/fns';
import {generateTestFilepath} from '../../../testUtils/generate/file';
import {
  generateAWSS3Credentials,
  generateFileBackendConfigForTest,
  generateFileBackendMountForTest,
} from '../../../testUtils/generate/fileBackend';
import {generateTestFolderpath} from '../../../testUtils/generate/folder';
import {completeTests} from '../../../testUtils/helpers/test';
import {initTests} from '../../../testUtils/testUtils';
import {FimidaraFilePersistenceProvider} from '../FimidaraFilePersistenceProvider';
import {LocalFsFilePersistenceProvider} from '../LocalFsFilePersistenceProvider';
import {MemoryFilePersistenceProvider} from '../MemoryFilePersistenceProvider';
import {S3FilePersistenceProvider} from '../S3FilePersistenceProvider';
import {
  defaultFileProviderResolver,
  defaultToFimidaraPath,
  defaultToNativePath,
  isFilePersistenceProvider,
} from '../utils';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('utils', () => {
  test('isFilePersistenceProvider', () => {
    expect(isFilePersistenceProvider(new FimidaraFilePersistenceProvider())).toBeTruthy();
    expect(
      isFilePersistenceProvider(new LocalFsFilePersistenceProvider({dir: tmpdir()}))
    ).toBeTruthy();
    expect(isFilePersistenceProvider(new MemoryFilePersistenceProvider())).toBeTruthy();
    expect(
      isFilePersistenceProvider(new S3FilePersistenceProvider(generateAWSS3Credentials()))
    ).toBeTruthy();
  });

  test('defaultFileProviderResolver', () => {
    const s3Creds = generateAWSS3Credentials();
    const s3Config = generateFileBackendConfigForTest({backend: kFileBackendType.s3});
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
