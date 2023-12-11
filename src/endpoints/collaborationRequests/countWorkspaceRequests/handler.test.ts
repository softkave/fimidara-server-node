import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generateData/collaborationRequest';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceCollaborationRequests from './handler';
import {CountWorkspaceCollaborationRequestsEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('countWorkspaceRequests', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertCollaborationRequestListForTest(15, () => ({
      workspaceId: workspace.resourceId,
    }));
    const count = await kSemanticModels.collaborationRequest().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData =
      RequestData.fromExpressRequest<CountWorkspaceCollaborationRequestsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspaceCollaborationRequests(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
