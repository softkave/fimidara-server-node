import {TokenAccessScope} from '../../../definitions/system';
import {forgotPasswordEmailTitle} from '../../../emailTemplates/forgotPassword';
import RequestData from '../../RequestData';
import {ITestBaseContext} from '../../testUtils/context/types';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import UserTokenQueries from '../UserTokenQueries';
import forgotPassword, {getForgotPasswordLinkFromToken} from './forgotPassword';
import {ForgotPasswordEndpointParams} from './types';

/**
 * TODO:
 * - test that forgot password fails if email does not exist
 * - that email has verification link
 */

let context: ITestBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('forgot password with email sent', async () => {
  assertContext(context);
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<ForgotPasswordEndpointParams>(
    mockExpressRequest(),
    {email: user.email}
  );
  const result = await forgotPassword(context, instData);
  assertEndpointResultOk(result);
  const forgotPasswordToken = await context.semantic.agentToken.assertGetOneByQuery(
    UserTokenQueries.getByUserIdAndTokenAccessScope(
      user.resourceId,
      TokenAccessScope.ChangePassword
    )
  );

  // confirm forgot password email was sent
  const link = getForgotPasswordLinkFromToken(context, forgotPasswordToken);
  expect(context.email.sendEmail.mock.lastCall[1].body.html.includes(link)).toBeTruthy();
  expect(context.email.sendEmail.mock.lastCall[1].body.text.includes(link)).toBeTruthy();
  expect(context.email.sendEmail.mock.lastCall[1].destination).toContainEqual(user.email);
  expect(context.email.sendEmail.mock.lastCall[1].subject).toBe(forgotPasswordEmailTitle);

  // const forgotPasswordEmailProps: ForgotPasswordEmailProps = {
  //   link,
  //   expiration: getForgotPasswordExpiration(),
  //   signupLink: context.appVariables.clientSignupLink,
  //   loginLink: context.appVariables.clientLoginLink,
  // };
  // const html = forgotPasswordEmailHTML(forgotPasswordEmailProps);
  // const text = forgotPasswordEmailText(forgotPasswordEmailProps);
  // expect(context.email.sendEmail).toHaveBeenLastCalledWith(expect.anything(), {
  //   subject: forgotPasswordEmailTitle,
  //   body: {html, text},
  //   destination: [user.email],
  //   source: context.appVariables.appDefaultEmailAddressFrom,
  // });
});
