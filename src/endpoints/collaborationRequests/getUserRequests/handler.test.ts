import {containsEveryItemIn} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
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

test("user's collaboration request returned", async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {user: user02, userToken: user02Token} = await insertUserForTest(context);

  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(context, userToken, workspace.resourceId, {
    recipientEmail: user02.email,
  });

  const instData = RequestData.fromExpressRequest(mockExpressRequestWithUserToken(user02Token), {
    workspaceId: workspace.resourceId,
  });

  const result = await getUserCollaborationRequests(context, instData);
  assertEndpointResultOk(result);
  expect(result.requests.length).toEqual(1);
  containsEveryItemIn(result.requests, [request01], item => item.resourceId);
});
