import {getNewId} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../contexts/ijx/register.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import TestMemoryFilePersistenceProviderContext from '../../testHelpers/context/file/TestMemoryFilePersistenceProviderContext.js';
import {generateAndInsertTestFileParts} from '../../testHelpers/generate/file.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import startMultipartUpload from '../startMultipartUpload/handler.js';
import {StartMultipartUploadEndpointParams} from '../startMultipartUpload/types.js';
import {stringifyFilenamepath} from '../utils.js';
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
    const job = (await kIjxSemantic.job().getOneByQuery({
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

    const dbItem = await kIjxSemantic
      .file()
      .getOneByQuery({resourceId: file.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });

  test('multipart upload part deleted', async () => {
    const backend = new TestMemoryFilePersistenceProviderContext();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {rawFile: file} = await insertFileForTest(userToken, workspace);

    const {clientMultipartId, internalMultipartId} =
      await callStartMultipartUpload({
        fileId: file.resourceId,
        workspaceId: workspace.resourceId,
        userToken,
      });

    await generateAndInsertTestFileParts(3, {
      fileId: file.resourceId,
      multipartId: internalMultipartId,
      part: 1,
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

    expect(backend.deleteMultipartUploadPart).toHaveBeenCalledWith({
      multipartId: internalMultipartId,
      part: 1,
      fileId: file.resourceId,
      filepath: stringifyFilenamepath(file),
      mount: expect.anything(),
      workspaceId: workspace.resourceId,
    });

    expect(backend.cleanupMultipartUpload).not.toHaveBeenCalled();

    const [dbFilePart] = await kIjxSemantic
      .filePart()
      .getManyByMultipartIdAndPart({
        multipartId: internalMultipartId,
        part: 1,
      });

    expect(dbFilePart).toBeFalsy();
  });

  test('multipart upload deleted', async () => {
    const backend = new TestMemoryFilePersistenceProviderContext();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {rawFile: file} = await insertFileForTest(userToken, workspace);

    const {clientMultipartId, internalMultipartId} =
      await callStartMultipartUpload({
        fileId: file.resourceId,
        workspaceId: workspace.resourceId,
        userToken,
      });

    await generateAndInsertTestFileParts(3, {
      fileId: file.resourceId,
      multipartId: internalMultipartId,
      part: 1,
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

    const parts = await kIjxSemantic.filePart().getManyByMultipartIdAndPart({
      multipartId: internalMultipartId,
    });

    expect(parts.length).toBe(0);

    const dbFile = await kIjxSemantic.file().getOneById(file.resourceId);
    expect(dbFile?.clientMultipartId).toBeFalsy();

    expect(backend.deleteMultipartUploadPart).not.toHaveBeenCalled();
    expect(backend.cleanupMultipartUpload).toHaveBeenCalledWith({
      multipartId: internalMultipartId,
      fileId: file.resourceId,
      filepath: stringifyFilenamepath(file),
      mount: expect.anything(),
      workspaceId: workspace.resourceId,
    });
  });
});

async function callStartMultipartUpload(params: {
  fileId: string;
  workspaceId: string;
  userToken: AgentToken;
}) {
  const clientMultipartId = getNewId();
  const reqData =
    RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
      mockExpressRequestWithAgentToken(params.userToken),
      {fileId: params.fileId, clientMultipartId}
    );

  const result = await startMultipartUpload(reqData);
  assertEndpointResultOk(result);

  const dbFile = await kIjxSemantic.file().getOneById(params.fileId);
  const internalMultipartId = dbFile?.internalMultipartId;
  appAssert(internalMultipartId);

  return {clientMultipartId, internalMultipartId};
}
