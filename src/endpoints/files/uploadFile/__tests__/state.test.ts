import assert from 'assert';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {FileProviderResolver} from '../../../../contexts/file/types.js';
import {kIjxSemantic, kIkxUtils} from '../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../contexts/ijx/register.js';
import {kSessionUtils} from '../../../../contexts/SessionContext.js';
import {kFileBackendType} from '../../../../definitions/fileBackend.js';
import {FimidaraSuppliedConfig} from '../../../../resources/config.js';
import RequestData from '../../../RequestData.js';
import {kGenerateTestFileType} from '../../../testUtils/generate/file/generateTestFileBinary.js';
import {expectFileBodyEqual} from '../../../testUtils/helpers/file.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {
  initTests,
  mockExpressRequestWithAgentToken,
} from '../../../testUtils/testUtils.js';
import {stringifyFilenamepath} from '../../utils.js';
import {uploadFileBaseTest} from '../testutils/utils.js';
import {UploadFileEndpointParams} from '../types.js';

let defaultFileProviderResolver: FileProviderResolver | undefined;
let defaultSuppliedConfig: FimidaraSuppliedConfig | undefined;

beforeAll(async () => {
  await initTests();
  defaultFileProviderResolver = kIkxUtils.fileProviderResolver();
  defaultSuppliedConfig = kIkxUtils.suppliedConfig();
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
  'state.uploadFile, params=%s',
  ({isMultipart}) => {
    test('file updated when new data uploaded', async () => {
      const backend = new MemoryFilePersistenceProvider();
      kRegisterIjxUtils.fileProviderResolver(() => {
        return backend;
      });

      const {savedFile, insertUserResult, insertWorkspaceResult} =
        await uploadFileBaseTest({
          isMultipart,
        });

      const matcher: Partial<UploadFileEndpointParams> = {
        filepath: stringifyFilenamepath(
          savedFile,
          insertWorkspaceResult.workspace.rootname
        ),
      };
      const {savedFile: updatedFile, dataBuffer} = await uploadFileBaseTest({
        isMultipart,
        insertUserResult,
        insertWorkspaceResult,
        input: matcher,
        type: kGenerateTestFileType.txt,
      });

      const agent = await kIkxUtils
        .session()
        .getAgentFromReq(
          RequestData.fromExpressRequest(
            mockExpressRequestWithAgentToken(insertUserResult.userToken)
          ),
          kSessionUtils.permittedAgentTypes.api,
          kSessionUtils.accessScopes.api
        );
      expect(savedFile.resourceId).toBe(updatedFile.resourceId);
      expect(savedFile.name).toBe(updatedFile.name);
      expect(savedFile.ext).toBe(updatedFile.ext);
      expect(savedFile.idPath).toEqual(
        expect.arrayContaining(updatedFile.idPath)
      );
      expect(savedFile.namepath).toEqual(
        expect.arrayContaining(updatedFile.namepath)
      );
      expect(savedFile.description).not.toBe(updatedFile.description);
      expect(savedFile.size).not.toBe(updatedFile.size);
      expect(updatedFile.lastUpdatedAt).toBeTruthy();
      expect(updatedFile.lastUpdatedBy).toMatchObject({
        agentId: agent.agentId,
        agentType: agent.agentType,
      });

      const fimidaraMount = await kIjxSemantic
        .fileBackendMount()
        .getOneByQuery({
          workspaceId: insertWorkspaceResult.workspace.resourceId,
          backend: kFileBackendType.fimidara,
        });
      assert(fimidaraMount);
      const persistedFile = backend.getMemoryFile({
        mount: fimidaraMount,
        workspaceId: insertWorkspaceResult.workspace.resourceId,
        filepath: stringifyFilenamepath(savedFile),
      });

      assert(persistedFile);
      assert(dataBuffer);
      await expectFileBodyEqual(dataBuffer, persistedFile.body);
    });

    test('file sized correctly', async () => {
      const {dataBuffer, savedFile} = await uploadFileBaseTest({
        isMultipart,
      });
      assert(dataBuffer);
      expect(dataBuffer.byteLength).toBeGreaterThan(0);
      expect(savedFile.size).toBe(dataBuffer.byteLength);
    });

    test('file versioned correctly', async () => {
      const result01 = await uploadFileBaseTest({isMultipart});
      const {insertUserResult, insertWorkspaceResult} = result01;
      let {savedFile} = result01;

      expect(savedFile.version).toBe(1);

      ({savedFile} = await uploadFileBaseTest({
        isMultipart,
        insertUserResult,
        insertWorkspaceResult,
        input: {
          filepath: stringifyFilenamepath(
            savedFile,
            insertWorkspaceResult.workspace.rootname
          ),
        },
      }));

      expect(savedFile.version).toBe(2);

      const dbFile = await kIjxSemantic.file().getOneById(savedFile.resourceId);
      expect(dbFile?.version).toBe(2);
    });
  }
);
