import RequestData from '../../RequestData';
import {generateAndInsertTestFiles} from '../../testUtils/generateData/file';
import {generateAndInsertTestFolders} from '../../testUtils/generateData/folder';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countFolderContent from './handler';
import {CountFolderContentEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('countFolderContent', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await Promise.all([
      generateAndInsertTestFolders(15, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(15, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const [foldersCount, filesCount] = await Promise.all([
      kSemanticModels.folder().countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      kSemanticModels.file().countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const instData = RequestData.fromExpressRequest<CountFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {folderpath: workspace.rootname}
    );
    const result = await countFolderContent(instData);
    assertEndpointResultOk(result);
    expect(result.filesCount).toBe(filesCount);
    expect(result.foldersCount).toBe(foldersCount);
  });
});
