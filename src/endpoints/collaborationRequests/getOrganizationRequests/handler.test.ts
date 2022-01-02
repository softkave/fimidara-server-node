import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getOrganizationRequests from './handler';
import {IGetOrganizationRequestsParams} from './types';

/**
 * TODO:
 * - Confirm that all the requests returned belong to the org
 */

test('organization collaboration requests returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {request: request02} = await insertRequestForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IGetOrganizationRequestsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
    }
  );

  const result = await getOrganizationRequests(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.requests.length).toBe(2);
  expect(result.requests).toContain(request01);
  expect(result.requests).toContain(request02);
});
