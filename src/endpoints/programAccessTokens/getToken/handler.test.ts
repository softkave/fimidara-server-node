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
import getProgramAccessToken from './handler';
import {IGetProgramAccessTokenEndpointParams} from './types';

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

test('referenced program access token returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IGetProgramAccessTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        tokenId: token01.resourceId,
      }
    );

  const result = await getProgramAccessToken(context, instData);
  assertEndpointResultOk(result);
  expect(result.token).toEqual(token01);
});
