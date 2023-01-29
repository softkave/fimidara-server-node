import {calculatePageSize} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertTestFiles} from '../../test-utils/generate-data/file';
import {generateAndInsertTestFolders, generateTestFolderName} from '../../test-utils/generate-data/folder';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {folderConstants} from '../constants';
import {addRootnameToPath} from '../utils';
import listFolderContent from './handler';
import {IListFolderContentEndpointParams} from './types';

/**
 * TODO:
 * - Test root path
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('listFolderContent', () => {
  test('folder content returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {folder: folder01} = await insertFolderForTest(context, userToken, workspace);
    const {folder: folder02} = await insertFolderForTest(context, userToken, workspace, {
      folderpath: addRootnameToPath(
        folder01.namePath.concat(generateTestFolderName()).join(folderConstants.nameSeparator),
        workspace.rootname
      ),
    });

    const {file} = await insertFileForTest(context, userToken, workspace, {
      filepath: addRootnameToPath(
        folder01.namePath.concat(generateTestFolderName()).join(folderConstants.nameSeparator),
        workspace.rootname
      ),
    });

    const instData = RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
    );
    const result = await listFolderContent(context, instData);
    assertEndpointResultOk(result);
    expect(result.folders).toContainEqual(folder02);
    expect(result.files).toContainEqual(file);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await Promise.all([
      generateAndInsertTestFolders(context, 15, {workspaceId: workspace.resourceId}),
      generateAndInsertTestFiles(context, 15, {workspaceId: workspace.resourceId}),
    ]);
    const [foldersCount, filesCount] = await Promise.all([
      context.data.folder.countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      context.data.file.countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {folderpath: workspace.rootname}
    );
    let result = await listFolderContent(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toContainEqual(page);
    expect(result.folders).toHaveLength(calculatePageSize(foldersCount, pageSize, page));
    expect(result.files).toHaveLength(calculatePageSize(filesCount, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {folderpath: workspace.rootname}
    );
    result = await listFolderContent(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toContainEqual(page);
    expect(result.folders).toHaveLength(calculatePageSize(foldersCount, pageSize, page));
    expect(result.files).toHaveLength(calculatePageSize(filesCount, pageSize, page));
  });
});
