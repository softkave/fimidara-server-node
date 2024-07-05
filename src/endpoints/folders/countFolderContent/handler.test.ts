import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertTestFiles} from '../../testUtils/generate/file.js';
import {generateAndInsertTestFolders} from '../../testUtils/generate/folder.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import countFolderContent from './handler.js';
import {CountFolderContentEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
    const reqData =
      RequestData.fromExpressRequest<CountFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {folderpath: workspace.rootname}
      );
    const result = await countFolderContent(reqData);
    assertEndpointResultOk(result);
    expect(result.filesCount).toBe(filesCount);
    expect(result.foldersCount).toBe(foldersCount);
  });
});
