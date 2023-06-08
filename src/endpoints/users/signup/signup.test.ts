import {faker} from '@faker-js/faker';
import {BaseContextType} from '../../contexts/types';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {assertContext, initTestBaseContext, insertUserForTest} from '../../testUtils/testUtils';
import UserQueries from '../UserQueries';
import {EmailAddressNotAvailableError} from '../errors';

/**
 * TODO:
 * - test that email verification email is sent
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('signup', () => {
  test('user signup successful with token creation', async () => {
    assertContext(context);
    const userInput = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const result = await insertUserForTest(context, userInput);
    const savedUser = await context.semantic.user.assertGetOneByQuery(
      UserQueries.getById(result.user.resourceId)
    );
    expect(savedUser).toBeTruthy();
    expect(result.userToken).toBeTruthy();
    expect(result.userTokenStr).toBeTruthy();
  });

  test('new signups are waitlisted', async () => {
    assertContext(context);
    const userInput = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    context.appVariables.FLAG_waitlistNewSignups = true;
    const result = await insertUserForTest(context, userInput);
    const savedUser = await context.semantic.user.assertGetOneByQuery(
      UserQueries.getById(result.user.resourceId)
    );
    expect(savedUser.isOnWaitlist).toBeTruthy();

    // TODO: if we ever switch to concurrent tests, then create a context for
    // this test instead
    context.appVariables.FLAG_waitlistNewSignups = false;
  });

  test('signup fails if email is not available', async () => {
    assertContext(context);
    const email = faker.internet.email();
    await generateAndInsertUserListForTest(context, /** count */ 1, () => ({email}));
    const userInput = {
      email,
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      password: faker.internet.password(),
    };

    await expectErrorThrown(async () => {
      assertContext(context);
      await insertUserForTest(context, userInput);
    }, [EmailAddressNotAvailableError.name]);
  });
});
