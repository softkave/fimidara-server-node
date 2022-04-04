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
import getProgramAccessToken from './handler';
import {IGetProgramAccessTokenEndpointParams} from './types';

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

test('referenced program access token returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.resourceId
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
