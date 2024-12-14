import {describe, expect, test} from 'vitest';
import {invokeEndpoint} from '../invokeEndpoint.js';
import {getFimidaraReadFileURL} from '../path/index.js';
import {getTestFilepath} from '../testutils/execFns/file.js';
import {
  fimidaraTestInstance,
  fimidaraTestVars,
  test_deleteFile,
  test_getFileDetails,
  test_readFile_nodeReadable,
  test_updateFileDetails,
  test_uploadFile_nodeReadable,
  test_uploadFile_nodeReadableNotFromFile,
  test_uploadFile_string,
} from '../testutils/tests/file.js';
import {
  getTestFileByteLength,
  getTestFileReadStream,
} from '../testutils/utils.node.js';

// TODO: test upload file with browser readable, buffer, and integer arrays

describe('file', () => {
  test('upload file with node.js readable', async () => {
    await test_uploadFile_nodeReadable();
  });

  test('upload file with string', async () => {
    await test_uploadFile_string();
  });

  test('upload file with node readable not from file', async () => {
    await test_uploadFile_nodeReadableNotFromFile();
  });

  test('read file with readable', async () => {
    await test_readFile_nodeReadable();
  });

  test('download file URL', async () => {
    const uploadedFile = await getTestFilepath(
      fimidaraTestInstance,
      fimidaraTestVars,
      /** file matcher, empty object will generate filepath internally */ {},
      /** upload file props */ {
        data: getTestFileReadStream(fimidaraTestVars),
        size: await getTestFileByteLength(fimidaraTestVars),
      }
    );
    const presignedPath =
      await fimidaraTestInstance.presignedPaths.issuePresignedPath({
        filepath: uploadedFile.filepath,
      });
    const presignedPathURL = getFimidaraReadFileURL({
      serverURL: fimidaraTestVars.serverURL,
      filepath: presignedPath.path,
      download: true,
    });
    const getFilepathURL = getFimidaraReadFileURL({
      serverURL: fimidaraTestVars.serverURL,
      filepath: uploadedFile.filepath,
      download: true,
    });

    expect(presignedPathURL).toBe(
      `${fimidaraTestVars.serverURL}/v1/files/readFile/${presignedPath.path}?download=true`
    );

    const readFileUsingPresignedPathResult = await invokeEndpoint({
      endpointURL: presignedPathURL,
      method: 'GET',
      responseType: 'blob',
    });

    expect(
      readFileUsingPresignedPathResult.headers['content-disposition']
    ).toContain(`attachment;`);

    const readFileUsingFilepathResult = await invokeEndpoint({
      endpointURL: getFilepathURL,
      token: fimidaraTestVars.authToken,
      method: 'POST',
      responseType: 'blob',
    });

    expect(
      readFileUsingFilepathResult.headers['content-disposition']
    ).toContain('attachment');
  });

  test('update file details', async () => {
    await test_updateFileDetails();
  });

  test('get file details', async () => {
    await test_getFileDetails();
  });

  test('delete file', async () => {
    await test_deleteFile();
  });

  test('getPartDetails', async () => {
    const {file} = await test_uploadFile_nodeReadable();
    const result = await fimidaraTestInstance.files.getPartDetails({
      fileId: file.resourceId,
    });

    expect(result.clientMultipartId).toBeFalsy();
    expect(result.continuationToken).toBeFalsy();
    expect(result.details).toHaveLength(0);
    expect(result.isDone).toBe(undefined);

    // TODO: add test for when multipart is in progress
  });
});
