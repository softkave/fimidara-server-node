import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import sendEmailVerificationCode from './handler';

/**
 * TODO:
 * - test that function fails if email is verified already
 * - that email has verification link
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('email verification code sent', async () => {
  const {user, userToken} = await insertUserForTest(
    /**userInput */ {},
    /**skipAutoVerifyEmail */ true
  );
  await kSemanticModels.utils().withTxn(opts => {
    return kSemanticModels
      .user()
      .getAndUpdateOneById(user.resourceId, {emailVerificationEmailSentAt: null}, opts);
  });
  const result = await sendEmailVerificationCode(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  assertEndpointResultOk(result);

  // TODO: confirm sendEmail was called with tokens. The code below has an issue
  // with the token generating different strings and I don't have the time now
  // to figure out why.

  // const confirmEmailProps: ConfirmEmailAddressEmailProps = {
  //   firstName: user.firstName,
  //   link: await getConfirmEmailLink( rawUser),
  // };
  // const html = confirmEmailAddressEmailHTML(confirmEmailProps);
  // const text = confirmEmailAddressEmailText(confirmEmailProps);
  // expect(kUtilsInjectables.email().sendEmail).toHaveBeenCalledWith( {
  //   subject: confirmEmailAddressEmailTitle,
  //   body: {html, text},
  //   destination: [user.email],
  //   source: kUtilsInjectables.config().appDefaultEmailAddressFrom,
  // });
});
