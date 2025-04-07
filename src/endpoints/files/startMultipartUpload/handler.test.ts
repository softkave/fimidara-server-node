import {randomUUID} from 'crypto';
import {isString} from 'lodash-es';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../contexts/ijx/register.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import TestFimidaraFilePersistenceProviderContext from '../../testHelpers/context/file/TestFimidaraFilePersistenceProviderContext.js';
import {
  generateAndInsertTestFileParts,
  generateAndInsertTestFiles,
  generateTestFilepath,
} from '../../testHelpers/generate/file.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {stringifyFilenamepath} from '../utils.js';
import {getNextMultipartTimeout} from '../utils/getNextMultipartTimeout.js';
import startMultipartUpload from './handler.js';
import {StartMultipartUploadEndpointParams} from './types.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('startMultipartUpload', () => {
  test('successfully starts multipart upload', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const clientMultipartId = 'test-multipart-id' + randomUUID();
    const reqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: stringifyFilenamepath(file, workspace.rootname),
          clientMultipartId,
        }
      );

    const result = await startMultipartUpload(reqData);
    assertEndpointResultOk(result);
    expect(result.file).toBeDefined();
    expect(result.file.resourceId).toBeDefined();
    expect(result.file.workspaceId).toBe(workspace.resourceId);
    expect(result.file.namepath).toEqual(file.namepath);

    const dbFile = await kIjxSemantic.file().getOneById(result.file.resourceId);
    expect(dbFile).toBeDefined();
    expect(dbFile?.internalMultipartId).toBeDefined();
    expect(dbFile?.clientMultipartId).toBe(clientMultipartId);
    expect(dbFile?.multipartTimeout).toBeGreaterThan(0);
  });

  test('fails with invalid filepath', async () => {
    const {userToken} = await insertUserForTest();

    const reqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: 'invalid/path',
          clientMultipartId: 'test-multipart-id',
        }
      );

    await expect(startMultipartUpload(reqData)).rejects.toThrow();
  });

  test('fails with invalid client multipart ID', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const reqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: stringifyFilenamepath(file, workspace.rootname),
          clientMultipartId: '', // Invalid empty client multipart ID
        }
      );

    await expect(startMultipartUpload(reqData)).rejects.toThrow();
  });

  test('fails with unauthorized user', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    // Create another user who doesn't have access to the workspace
    const {userToken: unauthorizedToken} = await insertUserForTest();
    const reqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(unauthorizedToken),
        {
          filepath: stringifyFilenamepath(file, workspace.rootname),
          clientMultipartId: 'test-multipart-id',
        }
      );

    await expect(async () => startMultipartUpload(reqData)).rejects.toThrow();
  });

  test('fails if file is not writable', async () => {
    const {userToken} = await insertUserForTest();
    const [file] = await generateAndInsertTestFiles(1, {
      parentId: null,
      isWriteAvailable: false,
    });

    const reqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          fileId: file.resourceId,
          clientMultipartId: 'test-multipart-id',
        }
      );

    await expect(() => startMultipartUpload(reqData)).rejects.toThrow();
  });

  test('cleans up existing multipart upload if past timeout', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const clientMultipartId = 'test-multipart-id' + randomUUID();
    const reqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: stringifyFilenamepath(file, workspace.rootname),
          clientMultipartId,
        }
      );

    await startMultipartUpload(reqData);
    const dbFile = await kIjxSemantic.file().getOneById(file.resourceId);
    expect(dbFile).toBeDefined();

    const internalMultipartId01 = dbFile?.internalMultipartId;
    expect(internalMultipartId01).toBeDefined();
    expect(dbFile?.clientMultipartId).toBe(clientMultipartId);

    // Insert some file parts to ensure they're cleaned up
    appAssert(isString(internalMultipartId01));
    await generateAndInsertTestFileParts(2, {
      fileId: file.resourceId,
      multipartId: internalMultipartId01,
    });

    // For some reason, using vi.useFakeTimers() hangs the test (even though I
    // set pool to threads - https://vitest.dev/api/vi.html#vi-usefaketimers),
    // so I'm using a manual timer update instead.
    await kIjxSemantic.utils().withTxn(async opts => {
      await kIjxSemantic
        .file()
        .updateOneById(
          file.resourceId,
          {multipartTimeout: Date.now() - getNextMultipartTimeout()},
          opts
        );
    });

    const mockBackend = new TestFimidaraFilePersistenceProviderContext();
    kRegisterIjxUtils.fileProviderResolver(() => mockBackend);

    const anotherClientMultipartId = 'test-multipart-id' + randomUUID();
    const anotherReqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: stringifyFilenamepath(file, workspace.rootname),
          clientMultipartId: anotherClientMultipartId,
        }
      );

    const result = await startMultipartUpload(anotherReqData);
    assertEndpointResultOk(result);

    // internal and client multipart IDs should be updated
    const dbFile02 = await kIjxSemantic.file().getOneById(file.resourceId);
    expect(dbFile02).toBeDefined();
    expect(dbFile02?.internalMultipartId).toBeDefined();
    expect(dbFile02?.clientMultipartId).toBe(anotherClientMultipartId);

    await kIjxUtils.promises().flush();

    // The first multipart upload parts should be cleaned up
    const dbFileParts01 = await kIjxSemantic
      .filePart()
      .getManyByMultipartIdAndPart({multipartId: internalMultipartId01});
    expect(dbFileParts01).toHaveLength(0);
    expect(mockBackend.cleanupMultipartUpload).toHaveBeenCalled();
  });

  test("creates new file if it doesn't exist", async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const namepath = generateTestFilepath();
    const filepath = stringifyFilenamepath({namepath}, workspace.rootname);

    const reqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath,
          clientMultipartId: 'test-multipart-id',
        }
      );

    const result = await startMultipartUpload(reqData);
    assertEndpointResultOk(result);
    expect(result.file).toBeDefined();
    expect(result.file.resourceId).toBeDefined();
    expect(result.file.workspaceId).toBe(workspace.resourceId);
    expect(result.file.namepath).toEqual(namepath);

    const dbFile = await kIjxSemantic.file().getOneByNamepath({
      workspaceId: workspace.resourceId,
      namepath,
    });
    expect(dbFile).toBeDefined();
    expect(dbFile?.internalMultipartId).toBeDefined();
    expect(dbFile?.clientMultipartId).toBe('test-multipart-id');
  });
});
