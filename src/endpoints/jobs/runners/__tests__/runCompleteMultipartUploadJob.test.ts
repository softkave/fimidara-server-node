import assert from 'assert';
import {getNewId} from 'softkave-js-utils';
import {Readable} from 'stream';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {AgentToken} from '../../../../definitions/agentToken.js';
import {PublicFile} from '../../../../definitions/file.js';
import {kJobType} from '../../../../definitions/job.js';
import startMultipartUpload from '../../../files/startMultipartUpload/handler.js';
import {StartMultipartUploadEndpointParams} from '../../../files/startMultipartUpload/types.js';
import uploadFile from '../../../files/uploadFile/handler.js';
import {UploadFileEndpointParams} from '../../../files/uploadFile/types.js';
import RequestData from '../../../RequestData.js';
import {expectFileBodyEqualById} from '../../../testHelpers/helpers/file.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../../testHelpers/utils.js';
import {runCompleteMultipartUploadJob} from '../runCompleteMultipartUploadJob.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runCompleteMultipartUploadJob', () => {
  test('upload completed', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    const clientMultipartId = getNewId();
    await startUpload({file, clientMultipartId, userToken});

    const buffer01 = Buffer.from('Hello world!');
    const buffer02 = Buffer.from('Hello world!');
    const buffer03 = Buffer.from('Hello world!');
    await Promise.all([
      uploadPart({
        file,
        clientMultipartId,
        buffer: buffer01,
        part: 1,
        userToken,
      }),
      uploadPart({
        file,
        clientMultipartId,
        buffer: buffer02,
        part: 2,
        userToken,
      }),
      uploadPart({
        file,
        clientMultipartId,
        buffer: buffer03,
        part: 3,
        userToken,
      }),
    ]);

    await runCompleteMultipartUploadJob({
      type: kJobType.completeMultipartUpload,
      params: {
        fileId: file.resourceId,
        parts: [{part: 1}, {part: 2}, {part: 3}],
        requestId: getNewId(),
      },
    });

    await kIjxUtils.promises().flush();

    const dbFile = await kIjxSemantic.file().getOneById(file.resourceId);
    assert.ok(dbFile);
    expect(dbFile.size).toBe(
      buffer01.byteLength + buffer02.byteLength + buffer03.byteLength
    );

    // File parts should be deleted
    const dbFileParts = await kIjxSemantic
      .filePart()
      .getManyByFileId(file.resourceId);
    expect(dbFileParts).toHaveLength(0);

    await expectFileBodyEqualById(
      file.resourceId,
      Readable.from([buffer01, buffer02, buffer03])
    );

    // TODO: check that parts are deleted from the file backend
  });
});

async function startUpload(params: {
  file: PublicFile;
  clientMultipartId: string;
  userToken: AgentToken;
}) {
  const startReq =
    RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
      mockExpressRequestWithAgentToken(params.userToken),
      {
        fileId: params.file.resourceId,
        clientMultipartId: params.clientMultipartId,
      }
    );

  await startMultipartUpload(startReq);
}

async function uploadPart(params: {
  file: PublicFile;
  clientMultipartId: string;
  buffer: Buffer;
  part: number;
  userToken: AgentToken;
}) {
  const uploadReq = RequestData.fromExpressRequest<UploadFileEndpointParams>(
    mockExpressRequestWithAgentToken(params.userToken),
    {
      fileId: params.file.resourceId,
      data: Readable.from([params.buffer]),
      size: params.buffer.byteLength,
      clientMultipartId: params.clientMultipartId,
      part: params.part,
    }
  );

  await uploadFile(uploadReq);
}
