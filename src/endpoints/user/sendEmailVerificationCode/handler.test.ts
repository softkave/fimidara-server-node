import {TokenAudience} from '../../contexts/SessionContext';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils';
import UserTokenQueries from '../UserTokenQueries';
import sendEmailVerificationCode from './handler';

/**
 * TODO:
 * - test that function fails if email is verified already
 * - that email has verification link
 */

test('email verification code sent', async () => {
  const context = getTestBaseContext();
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest(mockExpressRequest());
  const result = await sendEmailVerificationCode(context, instData);

  assertEndpointResultOk(result);
  await context.data.userToken.assertGetItem(
    UserTokenQueries.getByUserIdAndAudience(
      user.userId,
      TokenAudience.ConfirmEmailAddress
    )
  );

  context.email.assertMethodCalled('sendEmail');
});
