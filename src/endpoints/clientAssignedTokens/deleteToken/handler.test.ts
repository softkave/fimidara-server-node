import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import ClientAssignedTokenQueries from '../queries';
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
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IDeleteClientAssignedTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token.tokenId,
    }
  );

  const result = await deleteClientAssignedToken(context, instData);
  assertEndpointResultHasNoErrors(result);

  const deletedTokenExists = await context.data.clientAssignedToken.checkItemExists(
    ClientAssignedTokenQueries.getById(token.tokenId)
  );

  expect(deletedTokenExists).toBeFalsy();
});
