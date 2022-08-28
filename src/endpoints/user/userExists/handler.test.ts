import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils/test-utils';
import userExists from './handler';
import {IUserExistsParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
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
