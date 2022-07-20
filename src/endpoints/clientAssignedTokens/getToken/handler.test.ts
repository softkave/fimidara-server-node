import {IBaseContext} from '../../contexts/BaseContext';
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
import getWorkspaceClientAssignedTokens from './handler';
import {IGetClientAssignedTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Test that onReferenced feature works
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('client assigned token returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IGetClientAssignedTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        tokenId: token01.resourceId,
      }
    );

  const result = await getWorkspaceClientAssignedTokens(context, instData);
  assertEndpointResultOk(result);
  expect(result.token).toEqual(token01);
});
