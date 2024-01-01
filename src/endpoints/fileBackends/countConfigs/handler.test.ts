import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertFileBackendConfigListForTest} from '../../testUtils/generate/fileBackend';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countFileBackendConfigs from './handler';
import {CountFileBackendConfigsEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countFileBackendConfigs', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertFileBackendConfigListForTest(10, {
      workspaceId: workspace.resourceId,
    });
    const count = await kSemanticModels.fileBackendConfig().countByQuery({
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
