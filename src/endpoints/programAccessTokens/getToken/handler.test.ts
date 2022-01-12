import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
    organization.resourceId
  );

  const instData = RequestData.fromExpressRequest<IGetProgramAccessTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.resourceId,
    }
  );

  const result = await getProgramAccessToken(context, instData);
  assertEndpointResultOk(result);
  expect(result.token).toBe(token01);
});
