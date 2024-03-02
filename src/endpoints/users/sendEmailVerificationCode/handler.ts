import {addMinutes, isBefore} from 'date-fns';
import {User} from '../../../definitions/user';
import {appAssert} from '../../../utils/assertion';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {RateLimitError} from '../../errors';
import {userConstants} from '../constants';
import {EmailAddressVerifiedError} from '../errors';
import sendConfirmEmailAddressEmail from './sendConfirmEmailAddressEmail';
import {SendEmailVerificationCodeEndpoint} from './types';
import {withConfirmEmailAddressToken} from './withConfirmEmailAddressToken';

const sendEmailVerificationCode: SendEmailVerificationCodeEndpoint = async instData => {
  const user = await kUtilsInjectables.session().getUser(instData);
  await INTERNAL_sendEmailVerificationCode(user);
};

export async function INTERNAL_sendEmailVerificationCode(user: User) {
  await kSemanticModels.utils().withTxn(async opts => {
    if (user.isEmailVerified) {
      throw new EmailAddressVerifiedError();
    }

    if (user.emailVerificationEmailSentAt) {
      // Throw an error if the last time an email verification was sent is less
      // than the rate limit
      const nextDate = addMinutes(
        new Date(user.emailVerificationEmailSentAt),
        userConstants.verificationCodeRateLimitInMins
      );
      const shouldLimitRate = isBefore(new Date(), nextDate);

      if (shouldLimitRate) {
        throw new RateLimitError(
          `We sent an email verification email to ${user.email} on ${formatDate(
            user.emailVerificationEmailSentAt
          )}. Please try again later from ${formatDate(nextDate)}`
        );
      }
    }

    const link = await getConfirmEmailLink(user);
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    appAssert(suppliedConfig.clientLoginLink);
    appAssert(suppliedConfig.clientSignupLink);

    await Promise.all([
      sendConfirmEmailAddressEmail({
        link,
        emailAddress: user.email,
        firstName: user.firstName,
        signupLink: suppliedConfig.clientSignupLink,
        loginLink: suppliedConfig.clientLoginLink,
      }),
      kSemanticModels
        .user()
        .updateOneById(
          user.resourceId,
          {emailVerificationEmailSentAt: getTimestamp()},
          opts
        ),
    ]);
  }, /** reuseTxn */ false);
}

export async function getConfirmEmailLink(user: User) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.verifyEmailLink);
  return await withConfirmEmailAddressToken(user, suppliedConfig.verifyEmailLink);
}

export default sendEmailVerificationCode;
