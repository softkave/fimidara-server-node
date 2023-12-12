import {TokenAccessScopeMap} from '../../../definitions/system';
import {forgotPasswordEmailTitle} from '../../../emailTemplates/forgotPassword';
import RequestData from '../../RequestData';
import {ITestBaseContext} from '../../testUtils/context/types';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
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
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

test('forgot password with email sent', async () => {
  const {user} = await insertUserForTest();
  const instData = RequestData.fromExpressRequest<ForgotPasswordEndpointParams>(
    mockExpressRequest(),
    {email: user.email}
  );
  const result = await forgotPassword(instData);
  assertEndpointResultOk(result);
  const forgotPasswordToken = await kSemanticModels
    .agentToken()
    .assertGetOneByQuery(
      UserTokenQueries.getByUserIdAndTokenAccessScope(
        user.resourceId,
        TokenAccessScopeMap.ChangePassword
      )
    );

  // confirm forgot password email was sent
  const link = getForgotPasswordLinkFromToken(forgotPasswordToken);
  expect(
    kUtilsInjectables.email().sendEmail.mock.lastCall[1].body.html.includes(link)
  ).toBeTruthy();
  expect(
    kUtilsInjectables.email().sendEmail.mock.lastCall[1].body.text.includes(link)
  ).toBeTruthy();
  expect(kUtilsInjectables.email().sendEmail.mock.lastCall[1].destination).toContainEqual(
    user.email
  );
  expect(kUtilsInjectables.email().sendEmail.mock.lastCall[1].subject).toBe(
    forgotPasswordEmailTitle
  );

  // const forgotPasswordEmailProps: ForgotPasswordEmailProps = {
  //   link,
  //   expiration: getForgotPasswordExpiration(),
  //   signupLink: kUtilsInjectables.config().clientSignupLink,
  //   loginLink: kUtilsInjectables.config().clientLoginLink,
  // };
  // const html = forgotPasswordEmailHTML(forgotPasswordEmailProps);
  // const text = forgotPasswordEmailText(forgotPasswordEmailProps);
  // expect(kUtilsInjectables.email().sendEmail).toHaveBeenLastCalledWith(expect.anything(), {
  //   subject: forgotPasswordEmailTitle,
  //   body: {html, text},
  //   destination: [user.email],
  //   source: kUtilsInjectables.config().appDefaultEmailAddressFrom,
  // });
});
