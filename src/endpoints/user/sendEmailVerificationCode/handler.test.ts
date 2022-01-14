import {TokenAudience} from '../../contexts/SessionContext';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import UserTokenQueries from '../UserTokenQueries';
import sendEmailVerificationCode from './handler';

/**
 * TODO:
 * - test that function fails if email is verified already
 * - that email has verification link
 */

test('email verification code sent', async () => {
  const context = getTestBaseContext();
  const {user, userToken} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(userToken)
  );

  const result = await sendEmailVerificationCode(context, instData);

  assertEndpointResultOk(result);
  await context.data.userToken.assertGetItem(
    UserTokenQueries.getByUserIdAndAudience(
      user.resourceId,
      TokenAudience.ConfirmEmailAddress
    )
  );

  context.email.assertMethodCalled('sendEmail');
});
