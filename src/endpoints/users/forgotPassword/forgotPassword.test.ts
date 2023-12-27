import {kTokenAccessScope} from '../../../definitions/system';
import {forgotPasswordEmailTitle} from '../../../emailTemplates/forgotPassword';
import RequestData from '../../RequestData';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import forgotPassword, {getForgotPasswordLinkFromToken} from './forgotPassword';
import {ForgotPasswordEndpointParams} from './types';

/**
 * TODO:
 * - test that forgot password fails if email does not exist
 * - that email has verification link
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('forgot password with email sent', async () => {
  const {user} = await insertUserForTest();
  const instData = RequestData.fromExpressRequest<ForgotPasswordEndpointParams>(
    mockExpressRequest(),
    {email: user.email}
  );
  const result = await forgotPassword(instData);
  assertEndpointResultOk(result);
  const forgotPasswordToken = await kSemanticModels.agentToken().assertGetOneByQuery({
    resourceId: user.resourceId,
    scope: {$eq: [kTokenAccessScope.ChangePassword]},
  });

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
