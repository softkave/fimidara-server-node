import {faker} from '@faker-js/faker';
import assert from 'assert';
import {BaseContextType} from '../../endpoints/contexts/types';
import {generateAndInsertUserListForTest} from '../../endpoints/testUtils/generateData/user';
import {completeTest} from '../../endpoints/testUtils/helpers/test';
import {ISetupDevUserOptions, devUserSetupInitContext, setupDevUser} from './utils';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await devUserSetupInitContext();
});

afterAll(async () => {
  completeTest({context});
});

const appOptions: ISetupDevUserOptions = {
  getUserEmail: () => Promise.resolve({email: faker.internet.email()}),
  getUserInfo: () =>
    Promise.resolve({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      password: faker.internet.password(),
    }),
  getUserPassword: () =>
    Promise.resolve({
      password: faker.internet.password(),
    }),
};

describe('dev user setup', () => {
  test('dev user setup', async () => {
    assert(context);
    await setupDevUser(context, appOptions);
  });

  test('changes user password if user requires password change', async () => {
    assert(context);
    const userEmail = await appOptions.getUserEmail();
    await generateAndInsertUserListForTest(context, 1, () => ({
      requiresPasswordChange: true,
      email: userEmail.email,
    }));
    await setupDevUser(context, {
      ...appOptions,
      getUserEmail: () => Promise.resolve({email: userEmail.email}),
    });
    const user = await context.semantic.user.assertGetOneByQuery({email: userEmail.email});
    expect(user.requiresPasswordChange).toBeFalsy();
  });
});
