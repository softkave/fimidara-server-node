import {generateTestFolderName} from '../../testUtils/generateData/folder';
import {completeTests} from '../../testUtils/helpers/test';
import {
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

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

describe('addFolder', () => {
  test('folder created', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const folderName00 = generateTestFolderName();
    const folderName01 = generateTestFolderName();
    const folderName02 = generateTestFolderName();
    const folderpath02 = addRootnameToPath(
      '/' + folderName00 + '/' + folderName01 + '/' + folderName02,
      workspace.rootname
    );
    await insertFolderForTest(userToken, workspace, {
      folderpath: folderpath02,
    });

    const inputNames = [folderName00, folderName01, folderName02];
    const savedFolders = await kSemanticModels.folder().getManyByQuery({
      workspaceId: workspace.resourceId,
      name: {$in: inputNames},
    });
    const savedFolderNames = savedFolders.map(f => f.name);
    expect(savedFolderNames).toEqual(expect.arrayContaining(inputNames));
    expect(savedFolderNames).toHaveLength(inputNames.length);
  });
});
