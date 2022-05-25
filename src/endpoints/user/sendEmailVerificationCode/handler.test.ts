import {
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  confirmEmailAddressEmailTitle,
  IConfirmEmailAddressEmailProps,
} from '../../../email-templates/confirmEmailAddress';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {waitForWorks} from '../../utils';
import UserQueries from '../UserQueries';
import sendEmailVerificationCode, {getConfirmEmailLink} from './handler';

/**
 * TODO:
 * - test that function fails if email is verified already
 * - that email has verification link
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('email verification code sent', async () => {
  assertContext(context);
  const {
    user,
    userToken,
    reqData: insertUserReqData,
  } = await insertUserForTest(
    context,
    /**userInput */ {},
    /**skipAutoVerifyEmail */ true
  );

  await waitForWorks(insertUserReqData.pendingPromises);
  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(userToken)
  );

  await context.data.user.assertUpdateItem(
    UserQueries.getById(user.resourceId),
    {emailVerificationEmailSentAt: null}
  );

  const result = await sendEmailVerificationCode(context, instData);
  assertEndpointResultOk(result);

  // confirm sendEmail was called
  const confirmEmailProps: IConfirmEmailAddressEmailProps = {
    firstName: user.firstName,
    link: await getConfirmEmailLink(context, user),
  };

  const html = confirmEmailAddressEmailHTML(confirmEmailProps);
  const text = confirmEmailAddressEmailText(confirmEmailProps);
  expect(context.email.sendEmail).toHaveBeenCalledWith(context, {
    subject: confirmEmailAddressEmailTitle,
    body: {html, text},
    destination: [user.email],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
});
