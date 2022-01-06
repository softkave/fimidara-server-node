import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getUserOrganizations from './handler';

test('user organizations are returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization: org01} = await insertOrganizationForTest(
    context,
    userToken
  );
  const {organization: org02} = await insertOrganizationForTest(
    context,
    userToken
  );
  const {organization: org03} = await insertOrganizationForTest(
    context,
    userToken
  );

  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(userToken)
  );

  const result = await getUserOrganizations(context, instData);
  assertEndpointResultOk(result);

  expect(result.organizations.length).toHaveLength(3);
  expect(result.organizations).toContain(org01);
  expect(result.organizations).toContain(org02);
  expect(result.organizations).toContain(org03);
});
