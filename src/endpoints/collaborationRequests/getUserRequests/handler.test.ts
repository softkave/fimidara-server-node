import {calculatePageSize, getResourceId} from '../../../utils/fns';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generateData/collaborationRequest';
import {expectContainsEveryItemInForAnyType} from '../../testUtils/helpers/assertion';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getUserCollaborationRequests from './handler';

/**
 * TODO:
 * - Confirm that all the requests returned belong to the user
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getUserRequests', () => {
  test("user's collaboration request returned", async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {user: user02, userToken: user02Token} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      {recipientEmail: user02.email}
    );
    const instData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token),
      {}
    );
    const result = await getUserCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.requests.length).toEqual(1);
    expectContainsEveryItemInForAnyType(result.requests, [request01], getResourceId, getResourceId);
  });

  test('pagination', async () => {
    assertContext(context);
    const {user: user02, userToken: user02Token} = await insertUserForTest(context);
    await generateAndInsertCollaborationRequestListForTest(context, 15, () => ({
      recipientEmail: user02.email,
    }));
    const count = await context.semantic.collaborationRequest.countByQuery({
      recipientEmail: user02.email,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(user02Token), {
      pageSize,
    });
    let result = await getUserCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(user02Token), {
      page,
      pageSize,
    });
    result = await getUserCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
