import {faker} from '@faker-js/faker';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {insertUserForTest} from '../../testUtils/testUtils';
import UserQueries from '../UserQueries';
import {EmailAddressNotAvailableError} from '../errors';

/**
 * TODO:
 * - test that email verification email is sent
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('signup', () => {
  test('user signup successful with token creation', async () => {
    const userInput = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const result = await insertUserForTest(userInput);
    const savedUser = await kSemanticModels
      .user()
      .assertGetOneByQuery(UserQueries.getById(result.user.resourceId));
    expect(savedUser).toBeTruthy();
    expect(result.userToken).toBeTruthy();
    expect(result.userTokenStr).toBeTruthy();
  });

  test('new signups are waitlisted', async () => {
    const userInput = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    kUtilsInjectables.config().FLAG_waitlistNewSignups = true;
    const result = await insertUserForTest(userInput);
    const savedUser = await kSemanticModels
      .user()
      .assertGetOneByQuery(UserQueries.getById(result.user.resourceId));
    expect(savedUser.isOnWaitlist).toBeTruthy();

    // TODO: if we ever switch to concurrent tests, then create a context for
    // this test instead
    kUtilsInjectables.config().FLAG_waitlistNewSignups = false;
  });

  test('signup fails if email is not available', async () => {
    const email = faker.internet.email();
    await generateAndInsertUserListForTest(/** count */ 1, () => ({email}));
    const userInput = {
      email,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password(),
    };

    await expectErrorThrown(async () => {
      await insertUserForTest(userInput);
    }, [EmailAddressNotAvailableError.name]);
  });
});
