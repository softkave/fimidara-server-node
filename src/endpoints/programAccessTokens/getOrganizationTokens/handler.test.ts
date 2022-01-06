import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getOrganizationProgramAccessTokens from './handler';
import {IGetOrganizationProgramAccessTokensParams} from './types';

test("organization's program access token returned", async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {token: token02} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IGetOrganizationProgramAccessTokensParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
    }
  );

  const result = await getOrganizationProgramAccessTokens(context, instData);
  assertEndpointResultOk(result);
  expect(result.tokens).toContain(token01);
  expect(result.tokens).toContain(token02);
});