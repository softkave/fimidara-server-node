import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getUserRequests from './handler';

/**
 * TODO:
 * - Confirm that all the requests returned belong to the user
 */

test("user's collaboration request returned", async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {user: user02, userToken: user02Token} = await insertUserForTest(
    context
  );

  const {organization} = await insertOrganizationForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    organization.resourceId,
    {
      recipientEmail: user02.email,
    }
  );

  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(user02Token),
    {
      organizationId: organization.resourceId,
    }
  );

  const result = await getUserRequests(context, instData);
  assertEndpointResultOk(result);
  expect(result.requests.length).toBe(1);
  expect(result.requests).toContain(request01);
});
