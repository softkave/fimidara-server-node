import {sortStringListLexographically} from '../../../utils/fns';
import {BaseContextType} from '../../contexts/types';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';

/**
 * TODO:
 * - Test different folder paths
 * - Test on root
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('addFolder', () => {
  test('folder created', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);

    const folderpath01 = '/' + workspace.rootname + '/folders/images/first';
    const folderpath02 = '/' + workspace.rootname + '/folders/images/second';
    const folderpath03 = '/' + workspace.rootname + '/folders/images/third';
    await insertFolderForTest(context, userToken, workspace, {
      folderpath: folderpath03,
    });
    await Promise.all([
      insertFolderForTest(context, userToken, workspace, {
        folderpath: folderpath01,
      }),
      insertFolderForTest(context, userToken, workspace, {
        folderpath: folderpath02,
      }),
    ]);

    const inputNames = sortStringListLexographically([
      'folders',
      'images',
      'first',
      'second',
      'third',
    ]);
    const savedFolders = await context.semantic.folder.getManyByQuery({
      workspaceId: workspace.resourceId,
      name: {$in: inputNames},
    });
    const savedFolderNames = sortStringListLexographically(savedFolders.map(f => f.name));
    expect(savedFolderNames).toEqual(expect.arrayContaining(inputNames));
    expect(savedFolderNames).toHaveLength(inputNames.length);
  });
});
