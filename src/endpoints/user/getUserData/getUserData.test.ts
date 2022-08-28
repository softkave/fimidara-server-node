import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getUserData from './getUserData';

/**
 * TODO:
 * - test that handler fails if no token is present
 * - test that handler fails if token is invalid
 * - test that hanlder fails if user does not exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('user data is returned', async () => {
  assertContext(context);
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest(context, {
    password,
  });

  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(userToken)
  );

  const result = await getUserData(context, instData);
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);
});
