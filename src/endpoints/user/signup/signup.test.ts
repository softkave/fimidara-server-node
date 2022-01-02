import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  mockExpressRequest,
} from '../../test-utils';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import signup from './signup';
import {ISignupParams} from './types';

/**
 * TODO:
 * - test that signup fails when email is taken
 * - test that email verification email is sent
 */

test('user signup successful with token creation', async () => {
  const context = getTestBaseContext();
  const instData = RequestData.fromExpressRequest<ISignupParams>(
    mockExpressRequest(),
    {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    }
  );

  const result = await signup(context, instData);
  assertEndpointResultHasNoErrors(result);
  const savedUser = await context.data.user.assertGetItem(
    UserQueries.getById(result.user.userId)
  );

  expect(result.user).toEqual(savedUser);

  const tokenData = context.session.decodeToken(context, result.token);
  await context.data.userToken.assertGetItem(
    UserTokenQueries.getById(tokenData.sub.id)
  );
});
