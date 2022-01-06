import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getOrganizationClientAssignedTokens from './handler';
import {IGetOrganizationClientAssignedTokensParams} from './types';

test("organization's client assigned tokens returned", async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {token: token02} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IGetOrganizationClientAssignedTokensParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
    }
  );

  const result = await getOrganizationClientAssignedTokens(context, instData);
  assertEndpointResultOk(result);
  expect(result.tokens).toContain(token01);
  expect(result.tokens).toContain(token02);
});