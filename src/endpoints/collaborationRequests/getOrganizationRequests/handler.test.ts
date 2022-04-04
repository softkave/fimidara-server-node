import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getOrganizationRequests from './handler';
import {IGetOrganizationRequestsEndpointParams} from './types';

/**
 * TODO:
 * - Confirm that all the requests returned belong to the org
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('organization collaboration requests returned', async () => {
  assertContext(context);
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

  const instData =
    RequestData.fromExpressRequest<IGetOrganizationRequestsEndpointParams>(
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
