import {
  test_deleteFile,
  test_getFileDetails,
  test_readFile_nodeReadable,
  test_updateFileDetails,
  test_uploadFile_nodeReadable,
  test_uploadFile_nodeReadableNotFromFile,
  test_uploadFile_string,
} from '../testutils/tests/file';

describe('file', () => {
  test('upload file with node.js readable', async () => {
    await test_uploadFile_nodeReadable();
  });

  test('upload file with string', async () => {
    await test_uploadFile_string();
  });

  test.only('upload file with node readable not from file', async () => {
    await test_uploadFile_nodeReadableNotFromFile();
  });

  test('read file with readable', async () => {
    await test_readFile_nodeReadable();
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
