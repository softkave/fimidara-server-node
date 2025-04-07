import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertTestFiles} from '../../testHelpers/generate/file.js';
import {generateAndInsertTestFolders} from '../../testHelpers/generate/folder.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
      kIjxSemantic.folder().countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      kIjxSemantic.file().countByQuery({
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
