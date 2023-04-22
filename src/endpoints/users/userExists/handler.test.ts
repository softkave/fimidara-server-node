import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import userExists from './handler';
import {UserExistsEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('returns true if user exists', async () => {
  assertContext(context);
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<UserExistsEndpointParams>(mockExpressRequest(), {
    email: user.email,
  });

  const result = await userExists(context, instData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(true);
});

test('returns false if user does not exists', async () => {
  assertContext(context);
  const instData = RequestData.fromExpressRequest<UserExistsEndpointParams>(mockExpressRequest(), {
    email: faker.internet.email(),
  });

  const result = await userExists(context, instData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(false);
});
