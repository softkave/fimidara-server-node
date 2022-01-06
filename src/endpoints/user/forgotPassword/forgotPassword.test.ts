import {TokenAudience} from '../../contexts/SessionContext';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils';
import UserTokenQueries from '../UserTokenQueries';
import forgotPassword from './forgotPassword';
import {IForgotPasswordParams} from './types';

/**
 * TODO:
 * - test that forgot password fails if email does not exist
 * - that email has verification link
 */

test('forgot password with email sent', async () => {
  const context = getTestBaseContext();
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<IForgotPasswordParams>(
    mockExpressRequest(),
    {
      email: user.email,
    }
  );

  const result = await forgotPassword(context, instData);
  assertEndpointResultOk(result);
  await context.data.userToken.assertGetItem(
    UserTokenQueries.getByUserIdAndAudience(
      user.userId,
      TokenAudience.ChangePassword
    )
  );

  context.email.assertMethodCalled('sendEmail');
});
