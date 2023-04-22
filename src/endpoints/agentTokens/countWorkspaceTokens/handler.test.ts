import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generateData/agentToken';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceAgentTokens from './handler';
import {CountWorkspaceAgentTokensEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('countWorkspaceAgentTokens', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertAgentTokenListForTest(context, 15, {
      workspaceId: workspace.resourceId,
    });
    const count = await context.semantic.agentToken.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData = RequestData.fromExpressRequest<CountWorkspaceAgentTokensEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await countWorkspaceAgentTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
