import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertFileBackendMountListForTest} from '../../testHelpers/generate/fileBackend.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import countFileBackendMounts from './handler.js';
import {CountFileBackendMountsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countFileBackendMounts', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertFileBackendMountListForTest(10, {
      workspaceId: workspace.resourceId,
    });
    const count = await kIjxSemantic.fileBackendMount().countByQuery({
      workspaceId: workspace.resourceId,
    });

    const reqData =
      RequestData.fromExpressRequest<CountFileBackendMountsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countFileBackendMounts(reqData);

    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
