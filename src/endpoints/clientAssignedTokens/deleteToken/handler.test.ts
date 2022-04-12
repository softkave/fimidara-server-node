import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertWorkspaceForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteClientAssignedToken from './handler';
import {IDeleteClientAssignedTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] test that onReferenced feature works
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('client assigned token deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IDeleteClientAssignedTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        tokenId: token.resourceId,
      }
    );

  const result = await deleteClientAssignedToken(context, instData);
  assertEndpointResultOk(result);

  const deletedTokenExists =
    await context.data.clientAssignedToken.checkItemExists(
      EndpointReusableQueries.getById(token.resourceId)
    );

  expect(deletedTokenExists).toBeFalsy();
});
