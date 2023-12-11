import RequestData from '../../RequestData';
import {generateAndInsertTagListForTest} from '../../testUtils/generateData/tag';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceTags from './handler';
import {CountWorkspaceTagsEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
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
