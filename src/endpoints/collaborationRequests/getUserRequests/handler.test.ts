import {calculatePageSize, expectContainsEveryItemIn} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaborationRequestListForTest} from '../../test-utils/generate-data/collaborationRequest';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getUserCollaborationRequests from './handler';

/**
 * TODO:
 * - Confirm that all the requests returned belong to the user
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
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
      {
        recipientEmail: user02.email,
      }
    );
    const instData = RequestData.fromExpressRequest(
      mockExpressRequestWithUserToken(user02Token),
      {}
    );
    const result = await getUserCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.requests.length).toEqual(1);
    expectContainsEveryItemIn(result.requests, [request01], item => item.resourceId);
  });

  test('pagination', async () => {
    assertContext(context);
    const {user: user02, userToken: user02Token} = await insertUserForTest(context);
    await generateAndInsertCollaborationRequestListForTest(context, 15, () => ({
      recipientEmail: user02.email,
    }));
    const count = await context.data.collaborationRequest.countByQuery({
      recipientEmail: user02.email,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest(mockExpressRequestWithUserToken(user02Token), {
      pageSize,
    });
    let result = await getUserCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest(mockExpressRequestWithUserToken(user02Token), {
      page,
      pageSize,
    });
    result = await getUserCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
