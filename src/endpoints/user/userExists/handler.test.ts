import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils/test-utils';
import userExists from './handler';
import {IUserExistsParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('returns true if user exists', async () => {
  assertContext(context);
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<IUserExistsParams>(
    mockExpressRequest(),
    {
      email: user.email,
    }
  );

  const result = await userExists(context, instData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(true);
});

test('returns false if user does not exists', async () => {
  assertContext(context);
  const instData = RequestData.fromExpressRequest<IUserExistsParams>(
    mockExpressRequest(),
    {
      email: faker.internet.email(),
    }
  );

  const result = await userExists(context, instData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(false);
});
