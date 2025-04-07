import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertFileBackendConfigListForTest} from '../../testHelpers/generate/fileBackend.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
    const count = await kIjxSemantic.fileBackendConfig().countByQuery({
      workspaceId: workspace.resourceId,
    });

    const reqData =
      RequestData.fromExpressRequest<CountFileBackendConfigsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countFileBackendConfigs(reqData);

    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
