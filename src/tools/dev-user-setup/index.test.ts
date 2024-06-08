import {faker} from '@faker-js/faker';
import {kSemanticModels} from '../../endpoints/contexts/injection/injectables.js';
import {generateAndInsertUserListForTest} from '../../endpoints/testUtils/generate/user.js';
import {completeTests} from '../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../endpoints/testUtils/testUtils.js';
import {ISetupDevUserOptions, setupDevUser} from './utils.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';

beforeAll(async () => {
  initTests();
});

afterAll(async () => {
  completeTests();
});

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
  test('dev user setup', async () => {
    await setupDevUser(appOptions);
  });

  test('changes user password if user requires password change', async () => {
    const userEmail = await appOptions.getUserEmail();
    await generateAndInsertUserListForTest(1, () => ({
      requiresPasswordChange: true,
      email: userEmail.email,
    }));
    await setupDevUser({
      ...appOptions,
      getUserEmail: () => Promise.resolve({email: userEmail.email}),
    });
    const user = await kSemanticModels.user().assertGetOneByQuery({
      email: userEmail.email,
    });
    expect(user.requiresPasswordChange).toBeFalsy();
  });
});
