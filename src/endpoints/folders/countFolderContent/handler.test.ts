import {BaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertTestFiles} from '../../testUtils/generateData/file';
import {generateAndInsertTestFolders} from '../../testUtils/generateData/folder';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countFolderContent from './handler';
import {CountFolderContentEndpointParams} from './types';

let context: BaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('countFolderContent', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await Promise.all([
      generateAndInsertTestFolders(context, 15, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(context, 15, {workspaceId: workspace.resourceId, parentId: null}),
    ]);
    const [foldersCount, filesCount] = await Promise.all([
      context.semantic.folder.countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      context.semantic.file.countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const instData = RequestData.fromExpressRequest<CountFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {folderpath: workspace.rootname}
    );
    const result = await countFolderContent(context, instData);
    assertEndpointResultOk(result);
    expect(result.filesCount).toBe(filesCount);
    expect(result.foldersCount).toBe(foldersCount);
  });
});
