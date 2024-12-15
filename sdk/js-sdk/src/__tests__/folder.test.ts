import {faker} from '@faker-js/faker';
import {describe, expect, test} from 'vitest';
import {FimidaraEndpoints} from '../endpoints/publicEndpoints.js';
import {fimidaraAddRootnameToPath} from '../path/index.js';
import {
  addFolderTestExecFn,
  listFolderContentTestExecFn,
} from '../testutils/execFns/folder.js';
import {
  test_addFolder,
  test_deleteFolder,
  test_getFolder,
  test_listFolderContent,
  test_updateFolder,
} from '../testutils/tests/folder.js';
import {getTestVars} from '../testutils/utils.common.js';

describe('folder', () => {
  test('add folder', async () => {
    await test_addFolder();
  });

  test('folder not duplicated', async () => {
    const vars = getTestVars();
    const fimidara = new FimidaraEndpoints({
      authToken: vars.authToken,
      serverURL: vars.serverURL,
    });

    const generateFolderpath = (count: number) =>
      Array(count)
        .fill(0)
        .map(() => faker.lorem.words(9).replaceAll(' ', '_'))
        .join('/');
    const folderpath00 = fimidaraAddRootnameToPath(
      generateFolderpath(1),
      vars.workspaceRootname
    );
    const folderpath01 = folderpath00 + '/' + generateFolderpath(1);
    const folderpath02 = folderpath01 + '/' + generateFolderpath(1);
    const folderpath03 = folderpath01 + '/' + generateFolderpath(1);

    await addFolderTestExecFn(fimidara, vars, {
      folderpath: folderpath01,
    });
    await Promise.all([
      addFolderTestExecFn(fimidara, vars, {folderpath: folderpath03}),
      addFolderTestExecFn(fimidara, vars, {folderpath: folderpath02}),
    ]);

    const body = await listFolderContentTestExecFn(fimidara, vars, {
      folderpath: folderpath00,
    });
    expect(body.folders.length).toBe(1);
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
