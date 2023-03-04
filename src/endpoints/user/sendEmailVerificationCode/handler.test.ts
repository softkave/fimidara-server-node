import {
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  confirmEmailAddressEmailTitle,
  IConfirmEmailAddressEmailProps,
} from '../../../email-templates/confirmEmailAddress';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {waitForWorks} from '../../utils';
import sendEmailVerificationCode, {getConfirmEmailLink} from './handler';

/**
 * TODO:
 * - test that function fails if email is verified already
 * - that email has verification link
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('email verification code sent', async () => {
  assertContext(context);
  const {
    user,
    userToken,
    rawUser,
    reqData: insertUserReqData,
  } = await insertUserForTest(context, /**userInput */ {}, /**skipAutoVerifyEmail */ true);
  await waitForWorks(insertUserReqData.pendingPromises);
  await context.semantic.user.getAndUpdateOneById(user.resourceId, {
    emailVerificationEmailSentAt: null,
  });

  const result = await sendEmailVerificationCode(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  assertEndpointResultOk(result);

  // confirm sendEmail was called
  const confirmEmailProps: IConfirmEmailAddressEmailProps = {
    firstName: user.firstName,
    link: await getConfirmEmailLink(context, rawUser),
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
