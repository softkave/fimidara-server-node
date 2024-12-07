import assert from 'assert';
import {getNewId} from 'softkave-js-utils';
import {Readable} from 'stream';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import TestMemoryFilePersistenceProviderContext from '../../testUtils/context/file/TestMemoryFilePersistenceProviderContext.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {stringifyFilenamepath} from '../utils.js';
import {getMultipartUploadPartMetas} from '../utils/multipartUploadMeta.js';
import deleteFile from './handler.js';
import {DeleteFileEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteFile', () => {
  test('delete file job created', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    const reqData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await deleteFile(reqData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {type: kFimidaraResourceType.File},
      },
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: file.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kSemanticModels
      .file()
      .getOneByQuery({resourceId: file.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });

  test('multipart upload part deleted', async () => {
    const backend = new TestMemoryFilePersistenceProviderContext();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const clientMultipartId = getNewId();
    const data01 = Buffer.from('Hello world!');
    const data02 = Buffer.from('Hello world!');
    const {rawFile: file} = await insertFileForTest(userToken, workspace, {
      clientMultipartId,
      data: Readable.from([data01]),
      size: data01.byteLength,
      part: 1,
    });
    await insertFileForTest(userToken, workspace, {
      fileId: file.resourceId,
      clientMultipartId,
      data: Readable.from([data02]),
      size: data02.byteLength,
      part: 2,
    });

    const reqData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        clientMultipartId,
        part: 1,
        filepath: stringifyFilenamepath(file, workspace.rootname),
      }
    );
    const result = await deleteFile(reqData);
    assertEndpointResultOk(result);

    assert.ok(file.internalMultipartId);
    const {parts} = await getMultipartUploadPartMetas({
      multipartId: file.internalMultipartId,
    });
    expect(parts.length).toBe(1);
    expect(parts[0].part).toBe(2);

    const dbFile = await kSemanticModels.file().getOneById(file.resourceId);
    expect(dbFile?.clientMultipartId).toBe(clientMultipartId);

    expect(backend.deleteMultipartUploadPart).toHaveBeenCalledWith({
      multipartId: file.internalMultipartId,
      part: 1,
      fileId: file.resourceId,
      filepath: stringifyFilenamepath(file),
      mount: expect.anything(),
      workspaceId: workspace.resourceId,
    });
    expect(backend.cleanupMultipartUpload).not.toHaveBeenCalled();
  });

  test('multipart upload deleted', async () => {
    const backend = new TestMemoryFilePersistenceProviderContext();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const clientMultipartId = getNewId();
    const data01 = Buffer.from('Hello world!');
    const data02 = Buffer.from('Hello world!');
    const {rawFile: file} = await insertFileForTest(userToken, workspace, {
      clientMultipartId,
      data: Readable.from([data01]),
      size: data01.byteLength,
      part: 1,
    });
    await insertFileForTest(userToken, workspace, {
      fileId: file.resourceId,
      clientMultipartId,
      data: Readable.from([data02]),
      size: data02.byteLength,
      part: 2,
    });

    const reqData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        clientMultipartId,
        filepath: stringifyFilenamepath(file, workspace.rootname),
      }
    );
    const result = await deleteFile(reqData);
    assertEndpointResultOk(result);

    assert.ok(file.internalMultipartId);
    const {parts} = await getMultipartUploadPartMetas({
      multipartId: file.internalMultipartId,
    });
    expect(parts.length).toBe(0);

    const dbFile = await kSemanticModels.file().getOneById(file.resourceId);
    expect(dbFile?.clientMultipartId).toBeFalsy();

    expect(backend.deleteMultipartUploadPart).not.toHaveBeenCalled();
    expect(backend.cleanupMultipartUpload).toHaveBeenCalledWith({
      multipartId: file.internalMultipartId,
      fileId: file.resourceId,
      filepath: stringifyFilenamepath(file),
      mount: expect.anything(),
      workspaceId: workspace.resourceId,
    });
  });
});
