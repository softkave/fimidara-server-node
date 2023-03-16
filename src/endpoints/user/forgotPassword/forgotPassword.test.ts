import {TokenAccessScope} from '../../../definitions/system';
import {
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  forgotPasswordEmailTitle,
  IForgotPasswordEmailProps,
} from '../../../emailTemplates/forgotPassword';
import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
import RequestData from '../../RequestData';
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
import {IForgotPasswordEndpointParams} from './types';

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
  await disposeGlobalUtils();
  await context?.dispose();
});

test('forgot password with email sent', async () => {
  assertContext(context);
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<IForgotPasswordEndpointParams>(
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
