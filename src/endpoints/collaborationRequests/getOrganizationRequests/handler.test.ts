import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
    organization.resourceId
  );

  const {request: request02} = await insertRequestForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData = RequestData.fromExpressRequest<IGetOrganizationRequestsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.resourceId,
    }
  );

  const result = await getOrganizationRequests(context, instData);
  assertEndpointResultOk(result);
  expect(result.requests.length).toEqual(2);
  expect(result.requests).toContainEqual(request01);
  expect(result.requests).toContainEqual(request02);
});
