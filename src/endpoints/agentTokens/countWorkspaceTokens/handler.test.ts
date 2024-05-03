import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generate/agentToken.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import countWorkspaceAgentTokens from './handler.js';
import {CountWorkspaceAgentTokensEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countWorkspaceAgentTokens', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertAgentTokenListForTest(15, {
      workspaceId: workspace.resourceId,
    });
    const count = await kSemanticModels.agentToken().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData =
      RequestData.fromExpressRequest<CountWorkspaceAgentTokensEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspaceAgentTokens(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
