import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertFileBackendMountListForTest} from '../../testUtils/generate/fileBackend.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
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
    const count = await kSemanticModels.fileBackendMount().countByQuery({
      workspaceId: workspace.resourceId,
    });

    const instData = RequestData.fromExpressRequest<CountFileBackendMountsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await countFileBackendMounts(instData);

    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
