import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertTagListForTest} from '../../testUtils/generate/tag';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceTags from './handler';
import {CountWorkspaceTagsEndpointParams} from './types';

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
