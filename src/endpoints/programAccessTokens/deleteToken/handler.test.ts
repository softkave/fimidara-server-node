import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import ProgramAccessTokenQueries from '../queries';
import deleteProgramAccessToken from './handler';
import {IDeleteProgramAccessTokenParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

test('program access token deleted', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IDeleteProgramAccessTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token.tokenId,
    }
  );

  const result = await deleteProgramAccessToken(context, instData);
  assertEndpointResultHasNoErrors(result);

  const deletedTokenExists = await context.data.programAccessToken.checkItemExists(
    ProgramAccessTokenQueries.getById(token.tokenId)
  );

  expect(deletedTokenExists).toBeFalsy();
});
