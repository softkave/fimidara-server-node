import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteClientAssignedToken from './handler';
import {IDeleteClientAssignedTokenParams} from './types';

/**
 * TODO:
 * - [Low] test that onReferenced feature works
 */

test('client assigned token deleted', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData = RequestData.fromExpressRequest<IDeleteClientAssignedTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token.resourceId,
    }
  );

  const result = await deleteClientAssignedToken(context, instData);
  assertEndpointResultOk(result);

  const deletedTokenExists = await context.data.clientAssignedToken.checkItemExists(
    EndpointReusableQueries.getById(token.resourceId)
  );

  expect(deletedTokenExists).toBeFalsy();
});
