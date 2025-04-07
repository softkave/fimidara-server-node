import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
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
import completeMultipartUpload from './handler.js';
import {CompleteMultipartUploadEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('completeMultipartUpload', () => {
  test('successfully completes multipart upload', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const reqData =
      RequestData.fromExpressRequest<CompleteMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: stringifyFilenamepath(file, workspace.rootname),
          parts: [{part: 1}, {part: 2}],
          clientMultipartId: 'test-multipart-id',
        }
      );

    const result = await completeMultipartUpload(reqData);
    assertEndpointResultOk(result);
    expect(result.file).toBeDefined();
    expect(result.jobId).toBeDefined();
  });

  test('fails with invalid filepath', async () => {
    const {userToken} = await insertUserForTest();

    const reqData =
      RequestData.fromExpressRequest<CompleteMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: 'invalid/path',
          parts: [{part: 1}],
          clientMultipartId: 'test-multipart-id',
        }
      );

    await expect(completeMultipartUpload(reqData)).rejects.toThrow();
  });

  test('fails with invalid parts data', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const reqData =
      RequestData.fromExpressRequest<CompleteMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: stringifyFilenamepath(file, workspace.rootname),
          parts: [], // Invalid empty parts array
          clientMultipartId: 'test-multipart-id',
        }
      );

    await expect(completeMultipartUpload(reqData)).rejects.toThrow();
  });
});
