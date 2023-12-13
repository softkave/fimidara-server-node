import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generateData/agentToken';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceAgentTokens from './handler';
import {CountWorkspaceAgentTokensEndpointParams} from './types';

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
