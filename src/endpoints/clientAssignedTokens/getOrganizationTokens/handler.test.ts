import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getOrganizationClientAssignedTokens from './handler';
import {IGetOrganizationClientAssignedTokensParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test("organization's client assigned tokens returned", async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {token: token02} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IGetOrganizationClientAssignedTokensParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
      }
    );

  const result = await getOrganizationClientAssignedTokens(context, instData);
  assertEndpointResultOk(result);
  expect(result.tokens).toContainEqual(token01);
  expect(result.tokens).toContainEqual(token02);
});
