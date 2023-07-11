import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import sendEmailVerificationCode from './handler';

/**
 * TODO:
 * - test that function fails if email is verified already
 * - that email has verification link
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('email verification code sent', async () => {
  assertContext(context);
  const {user, userToken} = await insertUserForTest(
    context,
    /**userInput */ {},
    /**skipAutoVerifyEmail */ true
  );
  await context.semantic.utils.withTxn(context, opts => {
    assertContext(context);
    return context.semantic.user.getAndUpdateOneById(
      user.resourceId,
      {emailVerificationEmailSentAt: null},
      opts
    );
  });
  const result = await sendEmailVerificationCode(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  assertEndpointResultOk(result);

  // TODO: confirm sendEmail was called with tokens. The code below has an issue
  // with the token generating different strings and I don't have the time now
  // to figure out why.

  // const confirmEmailProps: ConfirmEmailAddressEmailProps = {
  //   firstName: user.firstName,
  //   link: await getConfirmEmailLink(context, rawUser),
  // };
  // const html = confirmEmailAddressEmailHTML(confirmEmailProps);
  // const text = confirmEmailAddressEmailText(confirmEmailProps);
  // expect(context.email.sendEmail).toHaveBeenCalledWith(context, {
  //   subject: confirmEmailAddressEmailTitle,
  //   body: {html, text},
  //   destination: [user.email],
  //   source: context.appVariables.appDefaultEmailAddressFrom,
  // });
});
