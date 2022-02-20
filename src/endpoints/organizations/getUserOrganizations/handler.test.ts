import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getUserOrganizations from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('user organizations are returned', async () => {
  assertContext(context);
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

  expect(result.organizations).toHaveLength(3);
  expect(result.organizations).toContainEqual(org01);
  expect(result.organizations).toContainEqual(org02);
  expect(result.organizations).toContainEqual(org03);
});
