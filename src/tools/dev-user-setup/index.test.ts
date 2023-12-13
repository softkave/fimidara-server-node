import {faker} from '@faker-js/faker';
import assert from 'assert';
import {generateAndInsertUserListForTest} from '../../endpoints/testUtils/generateData/user';
import {completeTests} from '../../endpoints/testUtils/helpers/test';
import {ISetupDevUserOptions, setupDevUser} from './utils';

beforeAll(async () => {
  context = await devUserSetupInitContext();
});

afterAll(async () => {
  completeTests({context});
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
    assert();
    await setupDevUser(appOptions);
  });

  test('changes user password if user requires password change', async () => {
    assert();
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
