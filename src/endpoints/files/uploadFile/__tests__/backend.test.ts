import assert from 'assert';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {FileProviderResolver} from '../../../../contexts/file/types.js';
import {kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../contexts/ijx/register.js';
import {FimidaraSuppliedConfig} from '../../../../resources/config.js';
import {stringifyFolderpath} from '../../../folders/utils.js';
import {generateTestFilepath} from '../../../testHelpers/generate/file.js';
import {kGenerateTestFileType} from '../../../testHelpers/generate/file/generateTestFileBinary.js';
import {expectFileBodyEqual} from '../../../testHelpers/helpers/file.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testHelpers/utils.js';
import {stringifyFilenamepath} from '../../utils.js';
import {uploadFileBaseTest} from '../testutils/utils.js';

let defaultFileProviderResolver: FileProviderResolver | undefined;
let defaultSuppliedConfig: FimidaraSuppliedConfig | undefined;

beforeAll(async () => {
  await initTests();
  defaultFileProviderResolver = kIjxUtils.fileProviderResolver();
  defaultSuppliedConfig = kIjxUtils.suppliedConfig();
});

afterEach(() => {
  assert(defaultFileProviderResolver);
  kRegisterIjxUtils.fileProviderResolver(defaultFileProviderResolver);
  if (defaultSuppliedConfig) {
    kRegisterIjxUtils.suppliedConfig(defaultSuppliedConfig);
  }
});

afterAll(async () => {
  await completeTests();
});

describe.each([{isMultipart: true}, {isMultipart: false}])(
  'backend.uploadFile, params=%s',
  ({isMultipart}) => {
    test('file uploaded to closest parent backend', async () => {
      const insertUserResult = await insertUserForTest();
      const {userToken} = insertUserResult;
      const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
      const {workspace} = insertWorkspaceResult;
      const filepath = generateTestFilepath({
        rootname: workspace.rootname,
        length: 4,
      });

      const [{rawMount: closerMount}, {rawMount: fartherMount}] =
        await Promise.all([
          insertFileBackendMountForTest(userToken, workspace, {
            folderpath: stringifyFolderpath(
              {namepath: filepath.slice(0, -1)}
              // filepath already has rootname in it
            ),
          }),
          insertFileBackendMountForTest(userToken, workspace, {
            folderpath: stringifyFolderpath(
              {namepath: filepath.slice(0, -2)}
              // filepath already has rootname in it
            ),
          }),
        ]);

      const closerMountBackend = new MemoryFilePersistenceProvider();
      const fartherMountBackend = new MemoryFilePersistenceProvider();
      kRegisterIjxUtils.fileProviderResolver(forMount => {
        if (forMount.resourceId === closerMount.resourceId) {
          return closerMountBackend;
        }

        return fartherMountBackend;
      });

      const {resFile, dbFile, dataBuffer} = await uploadFileBaseTest({
        isMultipart,
        insertUserResult,
        insertWorkspaceResult,
        input: {filepath: stringifyFilenamepath({namepath: filepath})},
        type: kGenerateTestFileType.png,
      });

      const persistedFile = closerMountBackend.getMemoryFile({
        mount: closerMount,
        workspaceId: workspace.resourceId,
        filepath: stringifyFilenamepath(resFile),
      });

      const fartherMountPersistedFile = fartherMountBackend.getMemoryFile({
        mount: fartherMount,
        workspaceId: workspace.resourceId,
        filepath: stringifyFilenamepath(resFile),
      });

      assert(persistedFile);
      assert(dataBuffer);
      expect(fartherMountPersistedFile).toBeFalsy();
      await expectFileBodyEqual(persistedFile.body, dataBuffer);

      expect(dbFile?.isWriteAvailable).toBeTruthy();
    });

    test('file uploaded to primary backend when parent has multiple mounts', async () => {
      const insertUserResult = await insertUserForTest();
      const {userToken} = insertUserResult;
      const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
      const {workspace} = insertWorkspaceResult;
      const filepath = generateTestFilepath({
        rootname: workspace.rootname,
        length: 4,
      });

      const [{rawMount: closerMount}, {rawMount: fartherMount}] =
        await Promise.all([
          insertFileBackendMountForTest(userToken, workspace, {
            folderpath: stringifyFolderpath(
              {namepath: filepath.slice(0, -1)}
              // filepath already has rootname
            ),
            index: 2,
          }),
          insertFileBackendMountForTest(userToken, workspace, {
            folderpath: stringifyFolderpath(
              {namepath: filepath.slice(0, -1)}
              // filepath already has rootname
            ),
            index: 1,
          }),
        ]);

      const closerMountBackend = new MemoryFilePersistenceProvider();
      const fartherMountBackend = new MemoryFilePersistenceProvider();
      kRegisterIjxUtils.fileProviderResolver(forMount => {
        if (forMount.resourceId === closerMount.resourceId) {
          return closerMountBackend;
        }

        return fartherMountBackend;
      });

      const {dataBuffer, resFile} = await uploadFileBaseTest({
        isMultipart,
        insertUserResult,
        insertWorkspaceResult,
        input: {filepath: stringifyFilenamepath({namepath: filepath})},
        type: kGenerateTestFileType.png,
      });

      const persistedFile = closerMountBackend.getMemoryFile({
        mount: closerMount,
        workspaceId: workspace.resourceId,
        filepath: stringifyFilenamepath(resFile),
      });

      const fartherMountPersistedFile = fartherMountBackend.getMemoryFile({
        mount: fartherMount,
        workspaceId: workspace.resourceId,
        filepath: stringifyFilenamepath(resFile),
      });

      assert(persistedFile);
      assert(dataBuffer);
      expect(fartherMountPersistedFile).toBeFalsy();
      await expectFileBodyEqual(dataBuffer, persistedFile.body);
    });
  }
);
