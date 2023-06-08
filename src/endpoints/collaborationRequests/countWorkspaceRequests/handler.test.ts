import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generateData/collaborationRequest';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceCollaborationRequests from './handler';
import {CountWorkspaceCollaborationRequestsEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('countWorkspaceRequests', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertCollaborationRequestListForTest(context, 15, () => ({
      workspaceId: workspace.resourceId,
    }));
    const count = await context.semantic.collaborationRequest.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData =
      RequestData.fromExpressRequest<CountWorkspaceCollaborationRequestsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspaceCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
