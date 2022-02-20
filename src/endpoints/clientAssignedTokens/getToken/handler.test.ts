import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getOrganizationClientAssignedTokens from './handler';
import {IGetClientAssignedTokenParams} from './types';

/**
 * TODO:
 * - [Low] Test that onReferenced feature works
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('client assigned token returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData = RequestData.fromExpressRequest<IGetClientAssignedTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.resourceId,
    }
  );

  const result = await getOrganizationClientAssignedTokens(context, instData);
  assertEndpointResultOk(result);
  expect(result.token).toEqual(token01);
});
