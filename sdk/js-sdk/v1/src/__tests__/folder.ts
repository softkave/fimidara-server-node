import {FimidaraEndpoints} from '..';
import {
  addFolderTest,
  deleteFolderTest,
  getFolderTest,
  listFolderContentTest,
  setupFolderContentTest,
  updateFolderTest,
} from '../testutils/folder';
import {
  ITestVars,
  containsNoneIn,
  getTestVars,
  indexByResourceId,
} from '../testutils/utils';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});

describe('folder', () => {
  test('add folder', async () => {
    await addFolderTest(fimidara, vars);
  });

  test('list folder content paginated', async () => {
    const count = 15;
    const pageSize = 10;
    const {folderpath} = await setupFolderContentTest(
      fimidara,
      vars,
      {},
      count
    );
    const [result00, result01] = await Promise.all([
      listFolderContentTest(fimidara, vars, {
        folderpath,
        pageSize,
        page: 0,
      }),
      listFolderContentTest(fimidara, vars, {
        folderpath,
        pageSize,
        page: 1,
      }),
    ]);
    expect(result00.body.page).toBe(0);
    expect(result01.body.page).toBe(1);
    containsNoneIn(result00.body.files, result01.body.files, indexByResourceId);
    containsNoneIn(
      result00.body.folders,
      result01.body.folders,
      indexByResourceId
    );
  });

  test('update folder', async () => {
    await updateFolderTest(fimidara, vars);
  });

  test('get folder', async () => {
    await getFolderTest(fimidara, vars);
  });

  test('delete folder', async () => {
    await deleteFolderTest(fimidara, vars);
  });
});
