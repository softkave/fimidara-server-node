import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generateData/collaborationRequest';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceCollaborationRequests from './handler';
import {ICountWorkspaceCollaborationRequestsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countWorkspaceRequests', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertCollaborationRequestListForTest(context, 15, () => ({
      workspaceId: workspace.resourceId,
    }));
    const count = await context.data.collaborationRequest.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData =
      RequestData.fromExpressRequest<ICountWorkspaceCollaborationRequestsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspaceCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
