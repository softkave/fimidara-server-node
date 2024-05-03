import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertFileBackendConfigListForTest} from '../../testUtils/generate/fileBackend.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import countFileBackendConfigs from './handler.js';
import {CountFileBackendConfigsEndpointParams} from './types.js';

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
