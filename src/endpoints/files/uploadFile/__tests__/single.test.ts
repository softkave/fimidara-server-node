import assert from 'assert';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {
  FilePersistenceProvider,
  FilePersistenceUploadFileParams,
  FileProviderResolver,
} from '../../../../contexts/file/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../contexts/ijx/register.js';
import {FimidaraSuppliedConfig} from '../../../../resources/config.js';
import {generateTestFilepathString} from '../../../testHelpers/generate/file.js';
import {expectErrorThrown} from '../../../testHelpers/helpers/error.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testHelpers/utils.js';
import {FileNotWritableError} from '../../errors.js';
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

describe('single.uploadFile', () => {
  test('file marked write available on error', async () => {
    const insertUserResult = await insertUserForTest();
    const insertWorkspaceResult = await insertWorkspaceForTest(
      insertUserResult.userToken
    );
    const {file} = await insertFileForTest(
      insertUserResult.userToken,
      insertWorkspaceResult.workspace
    );

    class TestFileProvider
      extends MemoryFilePersistenceProvider
      implements FilePersistenceProvider
    {
      uploadFile = async () => {
        throw new Error();
      };
    }

    kRegisterIjxUtils.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    await expectErrorThrown(async () => {
      await uploadFileBaseTest({
        insertUserResult,
        insertWorkspaceResult,
        isMultipart: false,
        input: {
          filepath: stringifyFilenamepath(
            file,
            insertWorkspaceResult.workspace.rootname
          ),
        },
      });
    });

    await kIjxUtils.promises().flush();
    const dbFile = await kIjxSemantic.file().getOneById(file.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
  });

  test('cannot double write file', async () => {
    const insertUserResult = await insertUserForTest();
    const insertWorkspaceResult = await insertWorkspaceForTest(
      insertUserResult.userToken
    );
    const {workspace} = insertWorkspaceResult;
    const filepath = generateTestFilepathString({
      rootname: workspace.rootname,
    });

    async function expectWriteFileFails() {
      try {
        await uploadFileBaseTest({
          isMultipart: false,
          insertUserResult,
          insertWorkspaceResult,
          input: {filepath},
        });
      } catch (error) {
        expect((error as Error)?.name).toBe(FileNotWritableError.name);
      }
    }

    class TestFileProvider
      extends MemoryFilePersistenceProvider
      implements FilePersistenceProvider
    {
      uploadFile = async (params: FilePersistenceUploadFileParams) => {
        await expectWriteFileFails();
        return super.uploadFile(params);
      };
    }

    kRegisterIjxUtils.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    await uploadFileBaseTest({
      isMultipart: false,
      insertUserResult,
      insertWorkspaceResult,
      input: {filepath},
    });
  });
});
