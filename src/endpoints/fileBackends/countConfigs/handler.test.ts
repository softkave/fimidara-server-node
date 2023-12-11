import RequestData from '../../RequestData';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generateData/agentToken';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countFileBackendConfigs from './handler';
import {CountFileBackendConfigsEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('countFileBackendConfigs', () => {
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
      RequestData.fromExpressRequest<CountFileBackendConfigsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countFileBackendConfigs(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
