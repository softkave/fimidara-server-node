import {BaseContextType} from '../../contexts/types';
import {generateTestFolderName} from '../../testUtils/generateData/folder';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {addRootnameToPath} from '../utils';

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

    const folderName00 = generateTestFolderName();
    const folderName01 = generateTestFolderName();
    const folderName02 = generateTestFolderName();
    const folderpath02 = addRootnameToPath(
      '/' + folderName00 + '/' + folderName01 + '/' + folderName02,
      workspace.rootname
    );
    await insertFolderForTest(context, userToken, workspace, {
      folderpath: folderpath02,
    });

    const inputNames = [folderName00, folderName01, folderName02];
    const savedFolders = await context.semantic.folder.getManyByQuery({
      workspaceId: workspace.resourceId,
      name: {$in: inputNames},
    });
    const savedFolderNames = savedFolders.map(f => f.name);
    expect(savedFolderNames).toEqual(expect.arrayContaining(inputNames));
    expect(savedFolderNames).toHaveLength(inputNames.length);
  });
});
