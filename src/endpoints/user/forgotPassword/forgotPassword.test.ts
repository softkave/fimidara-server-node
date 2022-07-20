import {
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  forgotPasswordEmailTitle,
  IForgotPasswordEmailProps,
} from '../../../email-templates/forgotPassword';
import {IBaseContext} from '../../contexts/BaseContext';
import {TokenAudience} from '../../contexts/SessionContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils/test-utils';
import UserTokenQueries from '../UserTokenQueries';
import forgotPassword, {
  getForgotPasswordExpiration,
  getForgotPasswordLinkFromToken,
} from './forgotPassword';
import {IForgotPasswordParams} from './types';

/**
 * TODO:
 * - test that forgot password fails if email does not exist
 * - that email has verification link
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('forgot password with email sent', async () => {
  assertContext(context);
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<IForgotPasswordParams>(
    mockExpressRequest(),
    {
      email: user.email,
    }
  );

  const result = await forgotPassword(context, instData);
  assertEndpointResultOk(result);
  const forgotPasswordToken = await context.data.userToken.assertGetItem(
    UserTokenQueries.getByUserIdAndAudience(
      user.resourceId,
      TokenAudience.ChangePassword
    )
  );

  // confirm forgot password email was sent
  const link = getForgotPasswordLinkFromToken(context, forgotPasswordToken);
  const forgotPasswordEmailProps: IForgotPasswordEmailProps = {
    link,
    expiration: getForgotPasswordExpiration(),
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
