import {getTestFilepath} from '../testutils/execFns/file';
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
} from '../testutils/tests/file';
import {getTestFileReadStream} from '../testutils/utils';
import {getFimidaraReadFileURL, invokeEndpoint} from '../utils';

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

  test('read file with download', async () => {
    const {result} = await test_readFile_nodeReadable({body: {download: true}});
    const headers = result.headers;

    expect(headers['content-disposition']).toBe('attachment');
  });

  test.only('download file URL', async () => {
    const uploadedFile = await getTestFilepath(
      fimidaraTestInstance,
      fimidaraTestVars,
      /** file matcher, empty object will generate filepath internally */ {},
      /** upload file props */ {data: getTestFileReadStream(fimidaraTestVars)}
    );
    const presignedPath =
      await fimidaraTestInstance.presignedPaths.issuePresignedPath({
        body: {filepath: uploadedFile.filepath},
      });
    const presignedPathURL = getFimidaraReadFileURL({
      serverURL: fimidaraTestVars.serverURL,
      filepath: presignedPath.body.path,
      download: true,
    });
    const getFilepathURL = getFimidaraReadFileURL({
      serverURL: fimidaraTestVars.serverURL,
      filepath: uploadedFile.filepath,
      download: true,
    });

    expect(presignedPathURL).toBe(
      `${fimidaraTestVars.serverURL}/v1/files/readFile/${presignedPath.body.path}?download=true`
    );

    const readFileUsingPresignedPathResult = await invokeEndpoint({
      endpointURL: presignedPathURL,
      method: 'GET',
      responseType: 'blob',
    });

    expect(
      readFileUsingPresignedPathResult.headers['content-disposition']
    ).toBe('attachment');

    const readFileUsingFilepathResult = await invokeEndpoint({
      endpointURL: getFilepathURL,
      token: fimidaraTestVars.authToken,
      method: 'POST',
      responseType: 'blob',
    });

    expect(readFileUsingFilepathResult.headers['content-disposition']).toBe(
      'attachment'
    );
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
});
