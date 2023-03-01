import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertTestFiles} from '../../test-utils/generate-data/file';
import {generateAndInsertTestFolders} from '../../test-utils/generate-data/folder';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import countFolderContent from './handler';
import {ICountFolderContentEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countFolderContent', () => {
  test('count', async () => {
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
    const instData = RequestData.fromExpressRequest<ICountFolderContentEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {folderpath: workspace.rootname}
    );
    const result = await countFolderContent(context, instData);
    assertEndpointResultOk(result);
    expect(result.filesCount).toBe(filesCount);
    expect(result.foldersCount).toBe(foldersCount);
  });
});