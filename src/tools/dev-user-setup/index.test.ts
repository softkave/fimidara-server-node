import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {generateAndInsertUserListForTest} from '../../endpoints/testHelpers/generate/user.js';
import {completeTests} from '../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../endpoints/testHelpers/utils.js';
import {ISetupDevUserOptions, setupDevUser} from './utils.js';

beforeAll(async () => {
  initTests();
});

afterAll(async () => {
  completeTests();
});

// TODO: test needs fixing

const appOptions: ISetupDevUserOptions = {
  getUserEmail: () => Promise.resolve({email: faker.internet.email()}),
  getUserInfo: () =>
    Promise.resolve({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password(),
    }),
  getUserPassword: () =>
    Promise.resolve({
      password: faker.internet.password(),
    }),
};

describe('dev user setup', () => {
  test.fails('dev user setup', async () => {
    await setupDevUser(appOptions);
  });

  test.fails('does not require password change', async () => {
    const userEmail = await appOptions.getUserEmail();
    await generateAndInsertUserListForTest(1, () => ({
      requiresPasswordChange: true,
      email: userEmail.email,
    }));
    await setupDevUser({
      ...appOptions,
      getUserEmail: () => Promise.resolve({email: userEmail.email}),
    });
    const user = await kIjxSemantic.user().assertGetOneByQuery({
      email: userEmail.email,
    });
    expect(user.requiresPasswordChange).toBeFalsy();
  });
});
