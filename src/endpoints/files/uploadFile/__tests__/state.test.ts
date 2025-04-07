import assert from 'assert';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {FileProviderResolver} from '../../../../contexts/file/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../contexts/ijx/register.js';
import {kSessionUtils} from '../../../../contexts/SessionContext.js';
import {kFileBackendType} from '../../../../definitions/fileBackend.js';
import {FimidaraSuppliedConfig} from '../../../../resources/config.js';
import RequestData from '../../../RequestData.js';
import {kGenerateTestFileType} from '../../../testHelpers/generate/file/generateTestFileBinary.js';
import {expectFileBodyEqual} from '../../../testHelpers/helpers/file.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  mockExpressRequestWithAgentToken,
} from '../../../testHelpers/utils.js';
import {stringifyFilenamepath} from '../../utils.js';
import {uploadFileBaseTest} from '../testutils/utils.js';
import {UploadFileEndpointParams} from '../types.js';

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
  'state.uploadFile, isMultipart=$isMultipart',
  ({isMultipart}) => {
    test('file updated when new data uploaded', async () => {
      const backend = new MemoryFilePersistenceProvider();
      kRegisterIjxUtils.fileProviderResolver(() => {
        return backend;
      });

      const {resFile, dbFile, insertUserResult, insertWorkspaceResult} =
        await uploadFileBaseTest({
          isMultipart,
        });

      const matcher: Partial<UploadFileEndpointParams> = {
        filepath: stringifyFilenamepath(
          resFile,
          insertWorkspaceResult.workspace.rootname
        ),
      };

      const {
        resFile: updatedResFile,
        dbFile: updatedDbFile,
        dataBuffer,
      } = await uploadFileBaseTest({
        isMultipart,
        insertUserResult,
        insertWorkspaceResult,
        input: matcher,
        type: kGenerateTestFileType.txt,
      });

      const agent = await kIjxUtils
        .session()
        .getAgentFromReq(
          RequestData.fromExpressRequest(
            mockExpressRequestWithAgentToken(insertUserResult.userToken)
          ),
          kSessionUtils.permittedAgentTypes.api,
          kSessionUtils.accessScopes.api
        );

      expect(dbFile.resourceId).toBe(updatedResFile.resourceId);
      expect(dbFile.name).toBe(updatedResFile.name);
      expect(dbFile.ext).toBe(updatedResFile.ext);
      expect(dbFile.idPath).toEqual(
        expect.arrayContaining(updatedResFile.idPath)
      );
      expect(dbFile.namepath).toEqual(
        expect.arrayContaining(updatedResFile.namepath)
      );
      expect(updatedDbFile.description).not.toBe(dbFile.description);
      expect(updatedDbFile.size).not.toBe(dbFile.size);
      expect(updatedDbFile.lastUpdatedAt).toBeTruthy();
      expect(updatedDbFile.lastUpdatedBy).toMatchObject({
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
        filepath: stringifyFilenamepath(updatedResFile),
      });

      assert(persistedFile);
      assert(dataBuffer);
      await expectFileBodyEqual(dataBuffer, persistedFile.body);
    });

    test('file sized correctly', async () => {
      const {dataBuffer, dbFile} = await uploadFileBaseTest({
        isMultipart,
      });
      assert(dataBuffer);
      expect(dataBuffer.byteLength).toBeGreaterThan(0);
      expect(dbFile.size).toBe(dataBuffer.byteLength);
    });

    test('file versioned correctly', async () => {
      const result01 = await uploadFileBaseTest({isMultipart});
      const {insertUserResult, insertWorkspaceResult, dbFile, resFile} =
        result01;

      expect(dbFile.version).toBe(1);

      const {dbFile: updatedDbFile} = await uploadFileBaseTest({
        isMultipart,
        insertUserResult,
        insertWorkspaceResult,
        input: {
          filepath: stringifyFilenamepath(
            resFile,
            insertWorkspaceResult.workspace.rootname
          ),
        },
      });

      expect(updatedDbFile?.version).toBe(2);
    });
  }
);
