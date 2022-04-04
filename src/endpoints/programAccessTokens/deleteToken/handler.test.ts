import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import ProgramAccessTokenQueries from '../queries';
import deleteProgramAccessToken from './handler';
import {IDeleteProgramAccessTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('program access token deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IDeleteProgramAccessTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        tokenId: token.resourceId,
      }
    );

  const result = await deleteProgramAccessToken(context, instData);
  assertEndpointResultOk(result);

  const deletedTokenExists =
    await context.data.programAccessToken.checkItemExists(
      ProgramAccessTokenQueries.getById(token.resourceId)
    );

  expect(deletedTokenExists).toBeFalsy();
});
