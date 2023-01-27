import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
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
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('program access token deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token} = await insertProgramAccessTokenForTest(context, userToken, workspace.resourceId);

  const instData = RequestData.fromExpressRequest<IDeleteProgramAccessTokenEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token.resourceId,
    }
  );

  const result = await deleteProgramAccessToken(context, instData);
  assertEndpointResultOk(result);

  const deletedTokenExists = await context.data.programAccessToken.existsByQuery(
    ProgramAccessTokenQueries.getById(token.resourceId)
  );

  expect(deletedTokenExists).toBeFalsy();
});
