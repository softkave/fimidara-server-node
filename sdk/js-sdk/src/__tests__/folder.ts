import {
  test_addFolder,
  test_deleteFolder,
  test_getFolder,
  test_listFolderContent,
  test_updateFolder,
} from '../testutils/tests/folder';

describe('folder', () => {
  test('add folder', async () => {
    await test_addFolder();
  });

  test('list folder content paginated', async () => {
    await test_listFolderContent();
  });

  test('update folder', async () => {
    await test_updateFolder();
  });

  test('get folder', async () => {
    await test_getFolder();
  });

  test('delete folder', async () => {
    await test_deleteFolder();
  });
});
