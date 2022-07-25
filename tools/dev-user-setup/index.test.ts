import {faker} from '@faker-js/faker';
import {setupDevUser} from './utils';

test('dev user setup', async () => {
  await setupDevUser({
    getUserEmail: () => Promise.resolve({email: faker.internet.email()}),
    getUserInfo: () =>
      Promise.resolve({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        password: faker.internet.password(),
      }),
  });
});
