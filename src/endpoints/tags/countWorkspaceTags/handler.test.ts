import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertTagListForTest} from '../../testUtils/generate/tag.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import countWorkspaceTags from './handler.js';
import {CountWorkspaceTagsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countWorkspaceTags', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertTagListForTest(15, {
      workspaceId: workspace.resourceId,
    });
    const count = await kSemanticModels.tag().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData = RequestData.fromExpressRequest<CountWorkspaceTagsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await countWorkspaceTags(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
