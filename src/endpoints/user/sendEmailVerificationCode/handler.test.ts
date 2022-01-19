import {TokenAudience} from '../../contexts/SessionContext';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {waitForWorks} from '../../utils';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import sendEmailVerificationCode from './handler';

/**
 * TODO:
 * - test that function fails if email is verified already
 * - that email has verification link
 */

test('email verification code sent', async () => {
  const context = getTestBaseContext();
  const {user, userToken, reqData: insertUserReqData} = await insertUserForTest(
    context
  );

  await waitForWorks(insertUserReqData.works);
  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(userToken)
  );

  await context.data.user.assertUpdateItem(
    UserQueries.getById(user.resourceId),
    {emailVerificationEmailSentAt: null}
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
