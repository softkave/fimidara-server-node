import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
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
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IGetClientAssignedTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.tokenId,
    }
  );

  const result = await getOrganizationClientAssignedTokens(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.token).toContain(token01);
});
