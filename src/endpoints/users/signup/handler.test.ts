import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../contexts/data/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register.js';
import {
  EmailJobParams,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {mergeData} from '../../../utils/fns.js';
import {generateAndInsertUserListForTest} from '../../testUtils/generate/user.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {initTests, insertUserForTest} from '../../testUtils/testUtils.js';
import {EmailAddressNotAvailableError} from '../errors.js';

/**
 * TODO:
 * - test that email verification email is sent
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
      .assertGetOneByQuery({resourceId: result.user.resourceId});
    expect(savedUser).toBeTruthy();
    expect(result.userToken).toBeTruthy();
    expect(result.token).toBeTruthy();

    await kUtilsInjectables.promises().flush();
    // const query: DataQuery<EmailMessage> = {
    //   type: kEmailMessageType.confirmEmailAddress,
    //   emailAddress: {$all: [savedUser.email]},
    //   userId: {$all: [savedUser.resourceId]},
    // };
    // const dbEmailMessage = await kSemanticModels.emailMessage().getOneByQuery(query);
    // expect(dbEmailMessage).toBeTruthy();

    const query: DataQuery<Job<EmailJobParams>> = {
      type: kJobType.email,
      params: {
        $objMatch: {
          type: kEmailJobType.confirmEmailAddress,
          emailAddress: {$all: [savedUser.email]},
          userId: {$all: [savedUser.resourceId]},
        },
      },
    };
    const dbJob = await kSemanticModels.job().getOneByQuery(query);
    expect(dbJob).toBeTruthy();
  });

  test('new signups are waitlisted', async () => {
    const userInput = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    kRegisterUtilsInjectables.suppliedConfig(
      mergeData(
        kUtilsInjectables.suppliedConfig(),
        {FLAG_waitlistNewSignups: true},
        {arrayUpdateStrategy: 'replace'}
      )
    );
    const result = await insertUserForTest(userInput);
    const savedUser = await kSemanticModels
      .user()
      .assertGetOneByQuery({resourceId: result.user.resourceId});
    expect(savedUser.isOnWaitlist).toBeTruthy();

    // TODO: if we ever switch to concurrent tests, then create a context for
    // this test instead
    kRegisterUtilsInjectables.suppliedConfig(
      mergeData(
        kUtilsInjectables.suppliedConfig(),
        {FLAG_waitlistNewSignups: false},
        {arrayUpdateStrategy: 'replace'}
      )
    );
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
