import {TokenAccessScope} from '../../../definitions/system';
import {
  forgotPasswordEmailHTML,
  ForgotPasswordEmailProps,
  forgotPasswordEmailText,
  forgotPasswordEmailTitle,
} from '../../../emailTemplates/forgotPassword';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import UserTokenQueries from '../UserTokenQueries';
import forgotPassword, {
  getForgotPasswordExpiration,
  getForgotPasswordLinkFromToken,
} from './forgotPassword';
import {ForgotPasswordEndpointParams} from './types';

/**
 * TODO:
 * - test that forgot password fails if email does not exist
 * - that email has verification link
 */

let context: BaseContextType | null = null;

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
  const forgotPasswordEmailProps: ForgotPasswordEmailProps = {
    link,
    expiration: getForgotPasswordExpiration(),
    signupLink: context.appVariables.clientSignupLink,
    loginLink: context.appVariables.clientLoginLink,
  };
  const html = forgotPasswordEmailHTML(forgotPasswordEmailProps);
  const text = forgotPasswordEmailText(forgotPasswordEmailProps);
  expect(context.email.sendEmail).toHaveBeenCalledWith(context, {
    subject: forgotPasswordEmailTitle,
    body: {html, text},
    destination: [user.email],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
});
