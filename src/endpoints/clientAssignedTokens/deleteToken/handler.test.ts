import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertClientAssignedTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
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
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('client assigned token deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token} = await insertClientAssignedTokenForTest(context, userToken, workspace.resourceId);
  const instData = RequestData.fromExpressRequest<IDeleteClientAssignedTokenEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {tokenId: token.resourceId}
  );
  const result = await deleteClientAssignedToken(context, instData);
  assertEndpointResultOk(result);
  const deletedTokenExists = await context.data.clientAssignedToken.existsByQuery(
    EndpointReusableQueries.getByResourceId(token.resourceId)
  );
  expect(deletedTokenExists).toBeFalsy();
});
