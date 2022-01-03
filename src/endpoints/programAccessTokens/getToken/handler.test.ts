import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getProgramAccessToken from './handler';
import {IGetProgramAccessTokenParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

test('referenced program access token returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IGetProgramAccessTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.tokenId,
    }
  );

  const result = await getProgramAccessToken(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.token).toBe(token01);
});
