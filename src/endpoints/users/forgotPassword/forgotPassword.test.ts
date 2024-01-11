import assert from 'assert';
import {kTokenAccessScope} from '../../../definitions/system';
import {kForgotPasswordEmailArtifacts} from '../../../emailTemplates/forgotPassword';
import RequestData from '../../RequestData';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register';
import MockTestEmailProviderContext from '../../testUtils/context/email/MockTestEmailProviderContext';
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

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('forgotPassword', () => {
  test('forgot password with email sent', async () => {
    kRegisterUtilsInjectables.email(new MockTestEmailProviderContext());

    const {user} = await insertUserForTest();
    const instData = RequestData.fromExpressRequest<ForgotPasswordEndpointParams>(
      mockExpressRequest(),
      {email: user.email}
    );
    const result = await forgotPassword(instData);
    assertEndpointResultOk(result);
    const forgotPasswordToken = await kSemanticModels.agentToken().assertGetOneByQuery({
      forEntityId: user.resourceId,
      scope: {$eq: [kTokenAccessScope.ChangePassword]},
    });

    const emailProvider = kUtilsInjectables.email();
    assert(emailProvider instanceof MockTestEmailProviderContext);

    // confirm forgot password email was sent
    const link = getForgotPasswordLinkFromToken(forgotPasswordToken);
    const lastCall = emailProvider.sendEmail.mock.lastCall;
    expect(lastCall[0].body.html.includes(link)).toBeTruthy();
    expect(lastCall[0].body.text.includes(link)).toBeTruthy();
    expect(lastCall[0].destination).toContainEqual(user.email);
    expect(lastCall[0].subject).toBe(kForgotPasswordEmailArtifacts.title);

    // const forgotPasswordEmailProps: ForgotPasswordEmailProps = {
    //   link,
    //   expiration: getForgotPasswordExpiration(),
    //   signupLink: kUtilsInjectables.config().clientSignupLink,
    //   loginLink: kUtilsInjectables.config().clientLoginLink,
    // };
    // const html = forgotPasswordEmailHTML(forgotPasswordEmailProps);
    // const text = forgotPasswordEmailText(forgotPasswordEmailProps);
    // expect(emailProvider.sendEmail).toHaveBeenLastCalledWith(expect.anything(), {
    //   subject: forgotPasswordEmailTitle,
    //   body: {html, text},
    //   destination: [user.email],
    //   source: kUtilsInjectables.config().appDefaultEmailAddressFrom,
    // });
  });
});
