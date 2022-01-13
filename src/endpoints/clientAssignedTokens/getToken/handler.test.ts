import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getOrganizationClientAssignedTokens from './handler';
import {IGetClientAssignedTokenParams} from './types';

/**
 * TODO:
 * - [Low] Test that onReferenced feature works
 */

test('client assigned token returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData = RequestData.fromExpressRequest<IGetClientAssignedTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.resourceId,
    }
  );

  const result = await getOrganizationClientAssignedTokens(context, instData);
  assertEndpointResultOk(result);
  expect(result.token).toEqual(token01);
});
