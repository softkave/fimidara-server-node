import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import userExists from './handler';
import {IUserExistsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('returns true if user exists', async () => {
  assertContext(context);
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<IUserExistsEndpointParams>(mockExpressRequest(), {
    email: user.email,
  });

  const result = await userExists(context, instData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(true);
});

test('returns false if user does not exists', async () => {
  assertContext(context);
  const instData = RequestData.fromExpressRequest<IUserExistsEndpointParams>(mockExpressRequest(), {
    email: faker.internet.email(),
  });

  const result = await userExists(context, instData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(false);
});
