import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
    organization.resourceId
  );

  const instData = RequestData.fromExpressRequest<IDeleteProgramAccessTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token.resourceId,
    }
  );

  const result = await deleteProgramAccessToken(context, instData);
  assertEndpointResultOk(result);

  const deletedTokenExists = await context.data.programAccessToken.checkItemExists(
    ProgramAccessTokenQueries.getById(token.resourceId)
  );

  expect(deletedTokenExists).toBeFalsy();
});
